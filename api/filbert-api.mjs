import express from 'express';
import session from 'express-session';
import mysqlSession from 'express-mysql-session';
import cors from 'cors';
import multer from 'multer';

import {
  FILBERT_SESSION_COOKIE_NAME,
  ENCRYPTION_KEY,
} from '@filbert/constants';
import { assertLoggedInUser } from '@filbert/auth';
import { mysqlConnectionConfig } from '@filbert/mysql';
import {
  log,
  info,
  error,
  success,
  saneEnvironmentOrExit,
} from '@filbert/util';

import { assertUserHasPost } from './lib/post-util.mjs';
import { postSignin, postSigninGoogle, postSignout } from './routes/signin.mjs';
import {
  getUser,
  patchProfile,
  getStats,
  patchPreferences,
} from './routes/user.mjs';
import {
  getPosts,
  getPostByCanonical,
  getPostById,
  patchPost,
  deletePublishedPost,
  getSummaryAndPhotoFromContent,
} from './routes/post.mjs';
import {
  postDraft,
  getDrafts,
  publishDraft,
  deleteDraftAndContentNodes,
} from './routes/draft.mjs';
import { uploadImage } from './routes/image.mjs';
import { getPostForEdit } from './routes/edit.mjs';
import {
  postHistoryLogEntries,
  undo,
  redo,
} from './routes/content-node-history.mjs';
import { duplicatePost } from './routes/duplicate.mjs';

const MysqlStore = mysqlSession(session);
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  try {
    const sessionStore = new MysqlStore(mysqlConnectionConfig);
    const storage = multer.memoryStorage();
    const upload = multer({
      storage, // TODO: store in memory as Buffer - bad idea?
      //dest: './uploads/', // store in filesystem
      limits: {
        // busboy option
        fileSize: 16777216, // 16MB in bytes max file size
      },
    });

    const app = express();
    app.use(
      express.json({
        limit: '2mb',
      })
    );
    app.use(
      cors({
        origin: [
          'http://localhost:3000',
          'https://filbert.xyz',
          'https://www.filbert.xyz',
        ],
        credentials: true,
      })
    );
    /**
     * initialize session, available at req.session
     */
    // TODO: centralize this to coordinate with sapper server.js
    if (isProduction) {
      app.enable('trust proxy');
    }
    app.use(
      session({
        key: FILBERT_SESSION_COOKIE_NAME,
        secret: ENCRYPTION_KEY,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          secure: isProduction,
          domain: isProduction ? '.filbert.xyz' : '',
        },
      })
    );

    // app.use((req, res, next) => {
    //   const setCookieValue = res.get('Set-Cookie')
    //     ? `\nres.get('Set-Cookie') ${res.get('Set-Cookie')}`
    //     : '';
    //   log('API', req.session.id, req.session, setCookieValue);
    //   next();
    // });

    /**
     * PUBLIC routes - be careful...
     */
    app.post('/signin', postSignin);
    app.post('/signin-google', postSigninGoogle);
    app.post('/signout', postSignout);
    app.get('/user/:username', getUser);
    app.get('/user-stats/:username', getStats);
    app.patch('/preferences', patchPreferences);
    app.get('/post', getPosts);
    app.get('/post/:canonical', getPostByCanonical);

    /**
     * SIGNED-IN routes - all routes defined after this middleware require a logged in user
     */
    app.use(assertLoggedInUser);

    app.patch('/profile', patchProfile);
    app.post('/post', postDraft);
    app.post('/image', upload.single('fileData'), uploadImage);
    app.get('/draft', getDrafts);

    // the following routes need to assert user has permission to CRUD post
    app.post('/content/:postId', [assertUserHasPost, postHistoryLogEntries]);
    app.patch('/post/:postId', [assertUserHasPost, patchPost]);
    app.delete('/post/:postId', [assertUserHasPost, deletePublishedPost]);
    app.get('/manage/:postId', [assertUserHasPost, getPostById]);
    app.get('/post-summary/:postId', [
      assertUserHasPost,
      getSummaryAndPhotoFromContent,
    ]);
    app.get('/edit/:postId', [assertUserHasPost, getPostForEdit]);
    app.post('/undo/:postId', [assertUserHasPost, undo]);
    app.post('/redo/:postId', [assertUserHasPost, redo]);
    app.post('/publish/:postId', [assertUserHasPost, publishDraft]);
    app.post('/duplicate/:postId', [assertUserHasPost, duplicatePost]);
    app.delete('/draft/:postId', [
      assertUserHasPost,
      deleteDraftAndContentNodes,
    ]);

    // STARTUP
    // global error handler to collect all errors here
    // pass 4 args or it won't be treated as an error handling middleware
    // https://expressjs.com/en/4x/api.html#app.use
    app.use((err, req, res, next) => {
      if (err) {
        error(err);
        if (typeof err !== 'object') {
          res.status(500).send({ message: err });
        }
        const { code, sqlMessage } = err;
        // SQL syntax error - probably from bad user input
        if (code === 'ER_PARSE_ERROR') {
          return res.status(400).send({ message: 'Bad Request' });
        }
        // user entered a duplicate canonical url
        if (code === 'ER_DUP_ENTRY' && sqlMessage.includes('canonical')) {
          return res
            .status(400)
            .send({ canonical: `Url '${req.body.canonical}' already taken.` });
        }

        res.status(500).send(err);
      }
    });
    app.listen(3001);
    success('Filbert API Started 👍');
  } catch (err) {
    error('main() error: ', err);
  }
}

saneEnvironmentOrExit(
  'MYSQL_ROOT_PASSWORD',
  'ENCRYPTION_KEY',
  'GOOGLE_API_FILBERT_CLIENT_ID',
  'LINODE_OBJECT_STORAGE_ACCESS_KEY',
  'LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY'
);

// from figlet
const welcomeMessage = `
          _____ _____ 
    /\\   |  __ \\_   _|
   /  \\  | |__) || |  
  / /\\ \\ |  ___/ | |  
 / ____ \\| |    _| |_ 
/_/    \\_\\_|   |_____|\n\n`;
info(welcomeMessage);
info('NODE_ENV', process.env.NODE_ENV);
main();
