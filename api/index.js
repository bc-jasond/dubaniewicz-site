// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require('esm')(module/*, options*/);

const express = require('express');
const cors = require('cors');
// const util = require('util');  for util.inspect()

const {
  getKnex,
  bulkContentNodeUpsert,
  bulkContentNodeDelete,
  getMysqlDatetime,
} = require('./mysql');
const { checkPassword } = require('./user');
const { encrypt, decrypt } = require('./cipher');

async function getNodes(knex, postId) {
  const nodesArray = await knex('content_node')
    .where('post_id', postId)
    .orderBy(['parent_id', 'position']);
  
  // group nodes by parent_id, sorted by position
  return nodesArray.reduce((acc, node) => {
    if (!acc[node.parent_id]) {
      acc[node.parent_id] = [];
    }
    acc[node.parent_id].push(node);
    return acc;
  }, {})
}

async function main() {
  try {
    const knex = await getKnex();
    
    const app = express();
    app.use(express.json());
    app.use(cors(/* TODO: whitelist *.dubaniewi.cz in PRODUCTION */))
    
    app.post('/signin', async (req, res) => {
      try {
        const { username, password } = req.body;
        const [user] = await knex('user')
          .where('username', username);
        
        if (!user) {
          res.status(401).send({ error: 'Invalid credentials' })
          return;
        }
        
        const passwordDoesMatch = await checkPassword(password, user.password);
        
        if (!passwordDoesMatch) {
          res.status(401).send({ error: 'Invalid credentials' })
          return;
        }
        
        res.send({
          token: encrypt(JSON.stringify(user)),
          session: {
            username: user.username,
            userId: user.id,
          },
        });
      } catch (err) {
        console.error('Signin Error: ', err)
        res.status(401).send({})
      }
    })
    
    app.get('/post', async (req, res) => {
      const posts = await knex('post')
        .select(
          'post.id',
          'user_id',
          'canonical',
          'title',
          'abstract',
          'post.created',
          'updated',
          'published',
          'post.deleted',
          'username',
        )
        .innerJoin('user', 'post.user_id', 'user.id')
        .whereNotNull('published')
        .orderBy('published', 'desc');
      // TODO: limit!
      // TODO: add canDelete, canEdit, canPublish fields to each
      
      res.send(posts);
    })
    
    app.get('/post/:canonical', async (req, res) => {
      const { canonical } = req.params;
      const [post] = await knex('post')
        .where({ canonical });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const contentNodes = await getNodes(knex, post.id);
      res.send({ post, contentNodes });
    })
    
    /**
     * authenticated routes - all routes defined after this middleware will assume a logged in user
     */
    app.use(async (req, res, next) => {
      try {
        const { headers: { authorization } } = req;
        // decrypt Authorization header
        // assign 'loggedInUser' session to req for all authenticated routes
        req.loggedInUser = JSON.parse(decrypt(authorization));
        // return 401 on failure
        next();
      } catch (err) {
        console.error('Authorization header Error', err);
        res.status(401).send({});
      }
    })
    
    /**
     * creates a new draft for logged in user
     */
    app.post('/post', async (req, res) => {
      const user_id = req.loggedInUser.id;
      const { title, canonical } = req.body;
      const [postId] = await knex
        .insert({ user_id, title, canonical })
        .into('post');
      res.send({ postId });
    })
  
    /**
     * save post fields - like title, canonical & abstract
     */
    app.patch('/post/:id', async (req, res) => {
      const { id } = req.params;
      const { title, canonical, abstract } = req.body;
      const [post] = await knex('post')
        .where({
          user_id: req.loggedInUser.id,
          id,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const result = await knex('post')
        .update({ title, canonical, abstract })
        .where({
          user_id: req.loggedInUser.id,
          id,
        })
      res.send({})
    })
  
    /**
     * delete a post
     */
    app.delete('/post/:canonical', async (req, res) => {
      const { canonical } = req.params;
      const [post] = await knex('post')
        .whereNotNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          canonical,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      /**
       * DANGER ZONE!!!
       */
      await knex('content_node')
        .where('post_id', post.id)
        .del();
      await knex('post')
        .where('id', post.id)
        .del();
      res.status(204).send({});
    })
    
    /**
     * get post for editing
     */
    app.get('/edit/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .where({
          id,
          user_id: req.loggedInUser.id,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const contentNodes = await getNodes(knex, post.id);
      res.send({ post, contentNodes });
    })
    
    /**
     * to show/hide the 'edit' button on the View/List pages
     * note: uses canonical string id, not int
     */
    app.get('/can-edit/:canonical', async (req, res) => {
      const { canonical } = req.params;
      const [post] = await knex('post')
        .where({
          canonical,
          user_id: req.loggedInUser.id,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      res.send({ id: post.id })
    })
    
    /**
     * to show/hide the 'delete' button on the Edit/View/List pages
     * note: uses canonical string id, not int
     */
    app.get('/can-delete/:id', async (req, res) => {
      const { id } = req.params;
      const whereClause = { user_id: req.loggedInUser.id };
      const idAsInt = parseInt(id, 10);
      if (Number.isInteger(idAsInt)) {
        whereClause.id = idAsInt;
      } else {
        whereClause.canonical = id;
      }
      const [post] = await knex('post')
        .where(whereClause);
      if (!post) {
        res.status(404).send({});
        return;
      }
      res.send({ id: post.id })
    })
    
    /**
     * to show/hide the 'publish' button on the Edit/View/List pages
     * note: uses canonical string id, not int
     */
    app.get('/can-publish/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .where({
          id,
          user_id: req.loggedInUser.id,
          published: null,
        });
        
      if (!post) {
        res.status(404).send({});
        return;
      }
      res.send({ id: post.id })
    })
    
    /**
     * takes a list of 1 or more content nodes to update and/or delete for a post
     */
    app.post('/content', async (req, res) => {
      try {
        const updates = req.body.filter(change => change[1].action === 'update');
        const deletes = req.body.filter(change => change[1].action === 'delete');
        // TODO: put in transaction
        // TODO: validate updates, trim invalid selections, orphaned nodes, etc.
        const updateResult = await bulkContentNodeUpsert(updates);
        const deleteResult = await bulkContentNodeDelete(deletes);
        res.send({ updateResult, deleteResult });
      } catch (err) {
        console.error('POST /content Error: ', err);
        res.status(500).send({})
      }
    })
    
    /**
     * list drafts for logged in user
     */
    app.get('/draft', async (req, res) => {
      const posts = await knex('post')
        .select(
          'post.id',
          'user_id',
          'canonical',
          'title',
          'abstract',
          'post.created',
          'updated',
          'published',
          'post.deleted',
          'username',
        )
        .innerJoin('user', 'post.user_id', 'user.id')
        .whereNull('published')
        .andWhere('post.user_id', req.loggedInUser.id)
        .orderBy('post.created', 'desc');
      
      res.send(posts);
    })
    
    /**
     * publish a draft - this is a one-time operation
     */
    app.post('/publish/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      if (!post.canonical) {
        res.status(400).send({ message: "Error: Can't publish a draft with no canonical URL" });
        return;
      }
      await knex('post')
        .update({ published: getMysqlDatetime() })
        .where({
          user_id: req.loggedInUser.id,
          id,
        })
      res.send({});
    })
    
    /**
     * delete a draft (and content nodes) for logged in user
     */
    app.delete('/draft/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id,
        });
      
      if (!post) {
        res.status(404).send({});
        return;
      }
      /**
       * DANGER ZONE!!!
       */
      await knex('content_node')
        .where('post_id', id)
        .del();
      await knex('post')
        .where('id', id)
        .del();
      
      res.status(204).send({});
    })
    
    app.listen(3001)
    
  } catch (err) {
    console.error('main() error: ', err);
  }
}

main();
