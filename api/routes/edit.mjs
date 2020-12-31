import { getNodesFlat } from '../lib/mysql.mjs';
/**
 * get post for editing - signed-in user only
 */
export async function getPostForEdit(req, res) {
  const { currentPost } = req;
  const {
    meta: { currentUndoHistoryId },
    id,
  } = currentPost;
  // can't edit a deleted post!
  if (currentPost.deleted) {
    res.status(404).send({});
    return;
  }

  const { contentNodes, selectionOffsets } = await getNodesFlat(
    id,
    currentUndoHistoryId
  );

  res.send({
    post: { ...currentPost, canEdit: true },
    contentNodes,
    selectionOffsets,
  });
}
