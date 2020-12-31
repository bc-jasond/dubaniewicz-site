import { Map } from 'immutable';
import { KEYCODE_Z } from '@filbert/constants';
import { stopAndPrevent } from '../../common/utils';
import { currentPost } from "../../stores";

export function isUndoEvent(evt) {
  return evt.keyCode === KEYCODE_Z && (evt.metaKey || evt.ctrlKey);
}

/**
 * moves the undo cursor position
 * applies the unexecute state to the document
 * IF user makes edits after an undo - all history entries after this current one need to be marked deleted before adding another one
 * @returns {Promise<void>}
 */
export async function handleUndo({
  evt,
  documentModel,
  historyManager,
  commitUpdates,
  editSectionNode,
  setEditSectionNode,
}) {
  if (!isUndoEvent(evt)) {
    return false;
  }

  stopAndPrevent(evt);

  const undoResult = await historyManager.undo();
  // already at beginning of history? or error?
  const nodesById = undoResult.get('nodesById', Map());
  const historyOffsets = undoResult.get('selectionOffsets', Map());
  const updatedPost = undoResult.get('updatedPost', Map());
  if (nodesById.size === 0) {
    return true;
  }

  console.info('UNDO!', undoResult.toJS());
  documentModel.setNodes(nodesById);
  // Right now, nothing depends on changes to the "post" object but, seems like bad form to
  // not update it given the meta data will have changed (currentUndoHistoryId)
  currentPost.set(updatedPost);
  if (editSectionNode) {
    // update this or undo/redo changes won't be reflected in the open menus while editing meta sections!
    setEditSectionNode(documentModel.getNode(editSectionNode.get('id')));
  }

  await commitUpdates(historyOffsets.toJS());
  return true;
}
