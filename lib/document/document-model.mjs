import immutable from 'immutable';

import {
  LINKED_LIST_HEAD_ID,
  LINKED_LIST_NODES_MAP,
  linkedListFromJS,
  getId,
  getNextId,
  getNode,
  getNext,
  getPrev,
  head,
  replace,
  append,
  insertBefore as insertBeforeSuper,
  insertAfter as insertAfterSuper,
  remove as removeSuper,
  isEmpty,
} from '@filbert/linked-list';

import { cleanText, cleanTextOrZeroLengthPlaceholder } from '@filbert/util';

const { Map } = immutable;

// Document level keys
export const DOCUMENT_POST_ID = 'postId';

// Document Node keys
export const NODE_CONTENT = 'content';
export const NODE_TYPE = 'type';
export const NODE_FORMAT_SELECTIONS = 'formatSelections';
export const NODE_META = 'meta';

// sections that can have text content
export const NODE_TYPE_H1 = 'h1';
export const NODE_TYPE_H2 = 'h2';
export const NODE_TYPE_P = 'p';
export const NODE_TYPE_PRE = 'pre';
export const NODE_TYPE_LI = 'li';

// sections that have "meta" content
export const NODE_TYPE_SPACER = 'spacer';
export const NODE_TYPE_IMAGE = 'image';
export const NODE_TYPE_QUOTE = 'quote';

// DOCUMENT NODE helpers

export function type(node) {
  return node.get(NODE_TYPE);
}

export function contentClean(node) {
  return cleanText(node.get(NODE_CONTENT) || '');
}

export function contentOrZeroLengthChar(node) {
  return cleanTextOrZeroLengthPlaceholder(node.get(NODE_CONTENT) || '');
}

export function meta(node) {
  return node.get(NODE_META, Map());
}

export function setMeta(node, key, value) {
  return node.setIn([NODE_META, key], value);
}

export function isTextType(node) {
  return [
    NODE_TYPE_H1,
    NODE_TYPE_H2,
    NODE_TYPE_PRE,
    NODE_TYPE_P,
    NODE_TYPE_LI,
  ].includes(type(node));
}

export function formatSelections(node) {
  return node.get(NODE_FORMAT_SELECTIONS, linkedListFromJS());
}

export function canHaveSelections(node) {
  return [NODE_TYPE_P, NODE_TYPE_LI].includes(type(node));
}

export function isMetaType(node) {
  return [NODE_TYPE_SPACER, NODE_TYPE_QUOTE, NODE_TYPE_IMAGE].includes(
    type(node)
  );
}

// DOCUMENT helpers

export function documentModelFromJS(obj = {}) {
  const linkedList = linkedListFromJS(obj);
  const headId = linkedList.get(LINKED_LIST_HEAD_ID);
  const nodes = linkedList
    .get(LINKED_LIST_NODES_MAP, Map())
    // add default FormatSelections to all nodes, even if empty
    // we can strip the empty ones before sending over the wire
    .map((node) =>
      node.set(
        NODE_FORMAT_SELECTIONS,
        linkedListFromJS(node.get(NODE_FORMAT_SELECTIONS))
      )
    );
  return Map({
    [LINKED_LIST_HEAD_ID]: headId,
    [LINKED_LIST_NODES_MAP]: nodes,
    [DOCUMENT_POST_ID]: obj.postId,
  });
}

// stores previous head
let currentHeadId;
// stores previous nodes Map() to create deltas for history log
let nodesChanged = Map();
// reference to last insert id because history log entries are "flattened" and lose order
let lastInsertId;
export function getLastInsertId() {
  return lastInsertId;
}

export function getNodesBetween(documentModel, leftNodeId, rightNodeId) {
  const leftNode = getNode(documentModel, leftNodeId);
  const rightNode = getNode(documentModel, rightNodeId);
  if (!getId(leftNode) || !getId(rightNode)) {
    console.error(
      'getNodesBetween() - must have valid start and end nodes',
      leftNodeId,
      rightNodeId
    );
    return [];
  }
  const middleNodes = [];
  let nextNode = getNext(documentModel, leftNodeId);
  while (getId(nextNode) !== rightNodeId) {
    middleNodes.push(nextNode);
    nextNode = getNext(documentModel, nextNode);
  }
  return middleNodes;
}

export function isFirstOfType(documentModel, nodeId) {
  const type = getNode(documentModel, nodeId).get(NODE_TYPE);
  return getPrev(documentModel, nodeId).get(NODE_TYPE) !== type;
}

export function isLastOfType(documentModel, nodeId) {
  const type = getNode(documentModel, nodeId).get(NODE_TYPE);
  return getNext(documentModel, nodeId).get(NODE_TYPE) !== type;
}

// build history log entry
export function getPendingHistoryLogEntry(documentModel) {
  let nodesThatHaveChanged = Map();
  nodesChanged.forEach((updatedNodeOrId) => {
    const id =
      typeof updatedNodeOrId === 'string'
        ? updatedNodeOrId
        : getId(updatedNodeOrId);
    nodesThatHaveChanged = nodesThatHaveChanged.set(id, updatedNodeOrId);
  });
  nodesChanged = Map();
  // head change?
  let headNewId;
  if (currentHeadId !== getId(head(documentModel))) {
    currentHeadId = getId(head(documentModel));
    headNewId = currentHeadId;
  }
  return {
    [LINKED_LIST_HEAD_ID]: headNewId,
    [LINKED_LIST_NODES_MAP]: nodesThatHaveChanged,
  };
}

export function update(documentModel, node) {
  if (getNode(documentModel, node).size === 0) {
    throw new Error('Cant find node');
  }
  if (getNextId(node) && getNext(documentModel, node).size === 0) {
    throw new Error('Cant find neighbor');
  }
  documentModel = replace(documentModel, node);
  // log of changes
  // only this one node changed
  nodesChanged = nodesChanged.set(getId(node), node);
  return {
    documentModel,
    historyLogEntry: getPendingHistoryLogEntry(documentModel),
  };
}

export function insertBefore(documentModel, data, nodeOrId) {
  if (getNode(documentModel, nodeOrId).size === 0) {
    throw new Error('Bad previous neighbor');
  }
  const prevNode = getPrev(documentModel, nodeOrId);
  let newNode;
  ({ linkedList: documentModel, node: newNode } = insertBeforeSuper(
    documentModel,
    {
      ...data,
      [NODE_CONTENT]: cleanText(data[NODE_CONTENT]),
    },
    nodeOrId
  ));
  // log of changes
  // the newly inserted node changed
  nodesChanged = nodesChanged.set(getId(newNode), newNode);
  // next pointer of the previous node to nodeOrId changed, if nodeOrId wasn't the head
  if (prevNode.size > 0) {
    // watch out for stale references on prevNode...
    nodesChanged = nodesChanged.set(
      getId(prevNode),
      getNode(documentModel, prevNode)
    );
  }
  lastInsertId = getId(newNode);
  return {
    documentModel,
    historyLogEntry: getPendingHistoryLogEntry(documentModel),
  };
}

export function insertAfter(documentModel, dataArg, nodeOrId) {
  let afterNode = Map();
  let newNode;
  let data = {
    ...dataArg,
    [NODE_CONTENT]: cleanText(dataArg[NODE_CONTENT]),
  };
  if (nodeOrId) {
    afterNode = getNode(documentModel, nodeOrId);
    if (afterNode.size === 0) {
      throw new Error('Bad next neighbor');
    }
    ({ linkedList: documentModel, node: newNode } = insertAfterSuper(
      documentModel,
      data,
      nodeOrId
    ));
  } else {
    ({ linkedList: documentModel, node: newNode } = append(
      documentModel,
      data
    ));
  }
  // log of changes
  // newly inserted node
  nodesChanged = nodesChanged.set(getId(newNode), newNode);
  // next pointer of nodeOrId changed
  if (afterNode.size > 0) {
    nodesChanged = nodesChanged.set(nodeOrId, getNode(documentModel, nodeOrId));
  }
  lastInsertId = getId(newNode);
  return {
    documentModel,
    historyLogEntry: getPendingHistoryLogEntry(documentModel),
  };
}

export function deleteNode(documentModel, node) {
  // get this now but next pointer will change so refresh below
  const prevNode = getPrev(documentModel, node);
  documentModel = removeSuper(documentModel, node);
  // log of changes
  // node that was deleted
  nodesChanged = nodesChanged.set(getId(node), getId(node));
  // next pointer of prev node, if node wasn't the head
  if (prevNode.size > 0) {
    nodesChanged = nodesChanged.set(
      getId(prevNode),
      getNode(documentModel, prevNode)
    );
  }
  // don't delete last node in document, reset it to an empty title
  if (isEmpty(documentModel)) {
    let placeholderTitle;
    ({ linkedList: documentModel, node: placeholderTitle } = append(
      documentModel,
      {
        [NODE_TYPE]: NODE_TYPE_H1,
        [NODE_CONTENT]: '',
      }
    ));
    nodesChanged = nodesChanged.set(getId(placeholderTitle), placeholderTitle);
  }
  return {
    documentModel,
    historyLogEntry: getPendingHistoryLogEntry(documentModel),
  };
}
