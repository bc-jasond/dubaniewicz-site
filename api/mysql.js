const knex = require('knex')

let knexConnection;

async function getKnex() {
  if (!knexConnection) {
    knexConnection = knex({
      client: 'mysql2',
      connection: {
        host: 'docker_host_database',
        user: 'root',
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: 'dubaniewicz'
      },
      asyncStackTraces: true,
      debug: true,
    });
  }
  return knexConnection;
}

export function getMysqlDatetime(date = null) {
  if (date && !(date instanceof Date)) {
    throw new Error(`getMysqlDatetime: ${date} isn't a built-in JS Date()`)
  }
  const dateInstance = date || new Date();
  // dirty! https://stackoverflow.com/a/15103764/1991322
  return dateInstance.getFullYear() + '-' +
    ("0" + (dateInstance.getMonth() + 1)).slice(-2) + '-' +
    ("0" + (dateInstance.getDate())).slice(-2) + ' ' +
    ("0" + dateInstance.getHours()).slice(-2) + ':' +
    ("0" + dateInstance.getMinutes()).slice(-2) + ':' +
    ("0" + dateInstance.getSeconds()).slice(-2);
}

// TODO: 'touch' post on each update/delete of content or publish
async function markPostUpdated(postId) {}

async function bulkContentNodeUpsert(records) {
  if (records.length === 0) return;
  const knexInstance = await getKnex();
  const query = `
    INSERT INTO content_node (post_id, id, parent_id, position, type, content, meta) VALUES
    ${records.map(() => '(?)').join(',')}
    ON DUPLICATE KEY UPDATE
    parent_id = VALUES(parent_id),
    position = VALUES(position),
    type = VALUES(type),
    content = VALUES(content),
    meta = VALUES(meta)`;
  
  const values = [];
  
  records.forEach(([nodeId, update]) => {
    const { post_id, node } = update;
    values.push([
      post_id,
      nodeId,
      // HACK: 'null' string for root node
      node.parent_id !== 'null' ? node.parent_id : null,
      node.position,
      node.type,
      node.content || '',
      JSON.stringify(node.meta || {}),
    ]);
  });
  
  return knexInstance.raw(query, values);
}

async function bulkContentNodeDelete(records) {
  // delete all records WHERE id IN (...recordIds) OR WHERE parent_id IN (...recordIds)
  if (records.length === 0) return;
  const postId = records[0][1].post_id;
  const recordIds = records.map(r => r[0]);
  const knexInstance = await getKnex();
  return knexInstance('content_node')
    .where('post_id', postId)
    .andWhere(builder => builder
      .whereIn('id', recordIds)
      .orWhereIn('parent_id', recordIds)
    )
    .del();
}

module.exports.getKnex = getKnex;
module.exports.bulkContentNodeUpsert = bulkContentNodeUpsert;
module.exports.bulkContentNodeDelete = bulkContentNodeDelete;