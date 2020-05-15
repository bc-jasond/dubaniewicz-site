import { fromJS, is, Map } from 'immutable';

import {
  HISTORY_KEY_EXECUTE_OFFSETS,
  HISTORY_KEY_EXECUTE_STATES,
  HISTORY_KEY_STATE,
  HISTORY_KEY_UNEXECUTE_OFFSETS,
  HISTORY_KEY_UNEXECUTE_STATES,
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { moreThanNCharsAreDifferent, reviver } from '../../common/utils';

export const characterDiffSize = 6;

let historyCandidateNode = Map();
let historyCandidateUnexecuteSelectionOffsets = {};
let historyCandidateExecuteSelectionOffsets = {};
let historyCandidateStateEntry = {};
let historyCandidateTimeout;
let historyQueue = [];

export default function HistoryManager(postId, pendingHistoryQueue = []) {
  function getHistoryQueue() {
    return historyQueue;
  }

  function clearPending() {
    // clear cache
    historyCandidateNode = Map();
    historyCandidateUnexecuteSelectionOffsets = {};
    historyCandidateExecuteSelectionOffsets = {};
    historyCandidateStateEntry = {};
    clearTimeout(historyCandidateTimeout);
  }

  async function flushPendingNodeUpdateLogEntry() {
    const historyEntry = fromJS(
      {
        [HISTORY_KEY_EXECUTE_OFFSETS]: historyCandidateExecuteSelectionOffsets,
        [HISTORY_KEY_UNEXECUTE_OFFSETS]: historyCandidateUnexecuteSelectionOffsets,
        [HISTORY_KEY_STATE]: [historyCandidateStateEntry],
      },
      reviver
    );
    console.info(
      'HISTORY PENDING: adding to node update history log',
      historyEntry.toJS()
    );
    historyQueue.push(historyEntry);
    clearPending();
  }

  async function appendToNodeUpdateLog({
    executeSelectionOffsets,
    unexecuteSelectionOffsets,
    state,
  }) {
    clearPending();
    const historyEntry = fromJS(
      {
        [HISTORY_KEY_EXECUTE_OFFSETS]: executeSelectionOffsets,
        [HISTORY_KEY_UNEXECUTE_OFFSETS]: unexecuteSelectionOffsets,
        [HISTORY_KEY_STATE]: state.filter(
          // remove no-op state entries
          (entry) => !is(entry.executeState, entry.unexecuteState)
        ),
      },
      reviver
    );
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    historyQueue.push(historyEntry);
  }

  function historyEntryToNodeUpdate(history, shouldExecute = true) {
    const statesByNodeId = history.get(HISTORY_KEY_STATE).map((state) => {
      const unexecute = state.get(HISTORY_KEY_UNEXECUTE_STATES);
      const execute = state.get(HISTORY_KEY_EXECUTE_STATES);
      return shouldExecute
        ? // redo: if execute is falsy, it was a delete operation.  Use the unexecute id to delete
          execute || unexecute.get('id')
        : // undo: if unexecute is falsy it was an insert - mark node for delete by returning just the id
          unexecute || execute.get('id');
    });

    return shouldExecute
      ? statesByNodeId
      : // play updates in reverse for undo!
        statesByNodeId.reverse();
  }

  // saves current snapshot of document given new history or an undo/redo history
  async function saveContentBatch() {
    const nodeUpdatesByNodeId = historyQueue
      // de-dupe happens on API
      .flatMap((historyEntry) => historyEntryToNodeUpdate(historyEntry).toJS());

    if (nodeUpdatesByNodeId.length === 0) {
      // we're current, no new updates to save
      return {};
    }

    const { error, data: result } = await apiPost(`/content/${postId}`, {
      nodeUpdatesByNodeId,
      // save history entries for new history only
      contentNodeHistory: historyQueue,
    });

    if (error) {
      // TODO: message user after X failures?
      console.error('Content Batch Update Error: ', error);
      return {};
    }
    // clear the pending history queue after successful save
    historyQueue = [];
    console.info('Save Batch result', nodeUpdatesByNodeId, result);
    return result;
  }

  function appendToNodeUpdateLogWhenNCharsAreDifferent({
    unexecuteSelectionOffsets,
    executeSelectionOffsets,
    state,
    comparisonPath,
  }) {
    if (state.length > 1) {
      throw new Error("I don't handle state with length > 1");
    }
    // compare last node in history state
    const lastStateEntry = [...state].pop();
    const {
      unexecuteState: nodeBeforeUpdate,
      executeState: nodeAfterUpdate,
    } = lastStateEntry;

    // always update the "execute" state
    historyCandidateStateEntry.executeState = nodeAfterUpdate;
    historyCandidateExecuteSelectionOffsets = executeSelectionOffsets;
    // save when user stops typing after a short wait - to make sure we don't lose the "last few chars"
    clearTimeout(historyCandidateTimeout);
    historyCandidateTimeout = setTimeout(flushPendingNodeUpdateLogEntry, 3000);
    // update history if the node changes or if "more than N chars" have changed in the same node
    if (historyCandidateNode.get('id') !== nodeAfterUpdate.get('id')) {
      if (historyCandidateNode.get('id')) {
        // make history entry for existing changes before tracking new node
        flushPendingNodeUpdateLogEntry();
      }
      historyCandidateNode = nodeBeforeUpdate; // this node matches the state in state.unexecuteState AKA "before" documentModel.update()
      historyCandidateUnexecuteSelectionOffsets = unexecuteSelectionOffsets;
      historyCandidateStateEntry = lastStateEntry;
    }

    // TODO: get document state (selectedNodeMap) and add to history list here
    if (
      moreThanNCharsAreDifferent(
        nodeAfterUpdate.getIn(comparisonPath, ''),
        historyCandidateNode.getIn(comparisonPath, '')
      )
    ) {
      flushPendingNodeUpdateLogEntry();
    }
  }

  function applyNodeUpdates(stateUpdatesByNodeId, offsets, nodesById) {
    let updatedNodesById = nodesById;

    stateUpdatesByNodeId.forEach((update) => {
      // an "update" will contain a whole node as Map()
      // a "delete" will contain just a node id as string
      const currentIsDelete = typeof update === 'string';
      const updateId = currentIsDelete ? update : update.get('id');
      if (currentIsDelete) {
        updatedNodesById = updatedNodesById.delete(updateId);
        return;
      }
      updatedNodesById = updatedNodesById.set(updateId, update);
    });

    return {
      nodesById: updatedNodesById,
      selectionOffsets: offsets,
    };
  }

  async function undo(currentNodesById) {
    const { error: undoError, data } = await apiPost(`/undo/${postId}`, {});
    if (undoError) {
      console.error(undoError);
      return null;
    }
    const undoResult = fromJS(data, reviver);
    // at beginning (empty object)?
    if (is(undoResult, Map())) {
      return null;
    }
    const updatedPost = undoResult.get('updatedPost');
    const history = undoResult.get('history').get('meta');
    const unexecuteOffsets = history.get(HISTORY_KEY_UNEXECUTE_OFFSETS, Map());
    const unexecuteStatesByNodeId = historyEntryToNodeUpdate(history, false);

    if (unexecuteStatesByNodeId.size === 0) {
      return Map();
    }

    // apply updates to current document state
    const { nodesById, selectionOffsets } = applyNodeUpdates(
      unexecuteStatesByNodeId,
      unexecuteOffsets,
      currentNodesById
    );
    return Map({ nodesById, selectionOffsets, updatedPost });
  }

  async function redo(currentNodesById) {
    const { error: redoError, data } = await apiPost(`/redo/${postId}`, {});
    if (redoError) {
      console.error(redoError);
      return null;
    }
    const redoResult = fromJS(data, reviver);
    // at beginning (empty object)?
    if (is(redoResult, Map())) {
      return null;
    }
    const updatedPost = redoResult.get('updatedPost');
    const history = redoResult.get('history').get('meta');
    const executeOffsets = history.get(HISTORY_KEY_EXECUTE_OFFSETS, Map());
    const executeStatesByNodeId = historyEntryToNodeUpdate(history);

    if (executeStatesByNodeId.size === 0) {
      return Map();
    }

    // apply updates to current document state
    const { nodesById, selectionOffsets } = applyNodeUpdates(
      executeStatesByNodeId,
      executeOffsets,
      currentNodesById
    );
    return Map({ nodesById, selectionOffsets, updatedPost });
  }

  // a new placeholder post will have not-yet-saved pending history
  historyQueue = pendingHistoryQueue;

  return {
    getHistoryQueue,
    saveContentBatch,
    flushPendingNodeUpdateLogEntry,
    appendToNodeUpdateLog,
    appendToNodeUpdateLogWhenNCharsAreDifferent,
    undo,
    redo,
  };
}

export function getLastExecuteIdFromHistory(history) {
  return [...history].pop().executeState.get('id');
}
