import {
  NODE_TYPE_H1,
  NODE_TYPE_P,
  NODE_TYPE_LI,
  DOM_TEXT_NODE_TYPE_ID,
  KEYCODE_TAB,
  KEYCODE_SHIFT_RIGHT,
  KEYCODE_SHIFT_OR_COMMAND_LEFT,
  KEYCODE_COMMAND_RIGHT,
  KEYCODE_CTRL,
  KEYCODE_ALT,
  KEYCODE_CAPS_LOCK,
  KEYCODE_ESC,
  KEYCODE_PAGE_UP,
  KEYCODE_PAGE_DOWN,
  KEYCODE_END,
  KEYCODE_HOME,
  KEYCODE_LEFT_ARROW,
  KEYCODE_UP_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_DOWN_ARROW,
  KEYCODE_F1,
  KEYCODE_F2,
  KEYCODE_F3,
  KEYCODE_F4,
  KEYCODE_F5,
  KEYCODE_F6,
  KEYCODE_F7,
  KEYCODE_F8,
  KEYCODE_F9,
  KEYCODE_F10,
  KEYCODE_F11,
  KEYCODE_F12,
  KEYCODE_PRINT_SCREEN,
  DOM_ELEMENT_NODE_TYPE_ID,
  KEYCODE_ENTER
} from './constants';
import { cleanText } from './utils';

let infiniteLoopCount = 0;

export function setCaret(nodeId, offset = -1, shouldFindLastNode = false) {
  const [containerNode] = document.getElementsByName(nodeId);
  if (!containerNode) {
    console.warn('setCaret containerNode NOT FOUND ', nodeId);
    return;
  }
  console.info('setCaret containerNode ', nodeId);
  // has a text node?
  const sel = removeAllRanges();
  const range = document.createRange();
  // find text node, if present
  infiniteLoopCount = 0;
  let textNode;
  if ([NODE_TYPE_P, NODE_TYPE_LI].includes(containerNode.dataset.type)) {
    [textNode, offset] = getChildTextNodeAndOffsetFromParentOffset(
      containerNode,
      offset
    );
  } else {
    const queue = [...containerNode.childNodes];
    while (queue.length) {
      if (infiniteLoopCount++ > 1000) {
        throw new Error('setCaret is Fuera de Control!!!');
      }
      // find first (queue), find last - (stack) yay!
      const current = shouldFindLastNode ? queue.pop() : queue.shift();
      if (current.nodeType === DOM_TEXT_NODE_TYPE_ID) {
        textNode = current;
        break;
      }
      if (current.childNodes.length) {
        queue.push(...current.childNodes);
      }
    }
  }
  if (textNode) {
    console.info('setCaret textNode ', textNode, ' offset ', offset);
    // set caret to end of text content
    let caretOffset = offset;
    if (offset === -1 || offset > textNode.textContent.length) {
      caretOffset = textNode.textContent.length;
    }
    range.setStart(textNode, caretOffset);
    sel.addRange(range);
  } else {
    console.warn(`setCaret - couldn't find a text node inside of `, nodeId);
  }
}

export function removeAllRanges() {
  const sel = window.getSelection();
  sel.removeAllRanges();
  return sel;
}

export function getRange() {
  const sel = window.getSelection();
  if (sel.rangeCount < 1) {
    return;
  }
  return sel.getRangeAt(0);
}

/**
 * Once formatting is applied to a paragraph, subsequent selections
 * could yield a child formatting element <em>, <strong>, etc. as the
 * Range commonAncestorContainer But, we need to express selections in
 * terms of an offset within the parent (AKA first ancestor with a 'name'
 * attribute) content
 *
 * @return [
 *  [start, end, nodeId], // starting node & offset
 *  [nodeId...],          // *optional ending node & offset, if user has highlighted across > 1 nodes
 * ]
 */
export function getHighlightedSelectionOffsets() {
  const range = getRange();
  if (!range) {
    return [[]];
  }
  const startNode = getFirstAncestorWithId(range.startContainer);
  const endNode = getFirstAncestorWithId(range.endContainer);
  // const commonAncestor = range.commonAncestorContainer;
  const rangeStartOffset = range.startOffset;
  const rangeEndOffset = range.endOffset;

  if (startNode === null || endNode === null) {
    return [[]];
  }

  const startNodeOffset = getParagraphContentOffset(
    range.startContainer,
    startNode
  );
  let startOffset = rangeStartOffset + startNodeOffset;
  // special case for an empty paragraph with a ZERO_LENGTH_PLACEHOLDER
  if (rangeStartOffset === 1 && cleanText(startNode.textContent).length === 0) {
    startOffset = 0;
  }
  // in consumer code range.collapsed can be checked by start[0] === start[1]
  const start = [
    startOffset,
    range.collapsed ? startOffset : cleanText(startNode.textContent).length,
    getNodeId(startNode)
  ];
  if (range.collapsed) {
    return [start];
  }

  const endNodeOffset = getParagraphContentOffset(range.endContainer, endNode);
  let endOffset = rangeEndOffset + endNodeOffset;
  // special case for an empty paragraph with a ZERO_LENGTH_PLACEHOLDER
  if (rangeEndOffset === 1 && cleanText(endNode.textContent).length === 0) {
    endOffset = 0;
  }
  const end = [0, endOffset, getNodeId(endNode)];

  if (startNode === endNode) {
    start[1] = endOffset;
    console.debug('getHighlightedSelectionOffsets SINGLE NODE');
    return [start];
  }

  console.debug('getHighlightedSelectionOffsets MULTIPLE NODES');
  //const selectedTextStart = startNode.textContent.slice(start[0]);
  //const selectedTextEnd = endNode.textContent.slice(0, end[1]);
  return [start, end];
}

/**
 * TODO: When React re-renders after setState() to apply formatting changes, the highlight is lost.
 *  Use this to replace it.
 */
export function replaceHighlightedSelection(
  startNode,
  startOffset,
  endNode,
  endOffset
) {}

/**
 * given a child node, find the offset in the parent paragraph of the beginning of the child node's textContent
 * NOTE: remember to add the current range offset to this number to get correct offset of all paragraph content
 * @param formattingNode
 * @param paragraph
 * @returns {number}
 */
function getParagraphContentOffset(formattingNode, paragraph) {
  if (formattingNode === paragraph) {
    return 0;
  }
  while (formattingNode.parentElement !== paragraph) {
    // find the first immediate child of the paragraph - we could be nested inside several formatting tags at this point
    // i.e. for <em><strong><strike>content here</strike></strong></em> - we want the <em> node
    formattingNode = formattingNode.parentElement;
  }
  // find the index of the immediate child
  const rangeIdx = Array.prototype.indexOf.call(
    paragraph.childNodes,
    formattingNode
  );
  let offset = 0;
  for (let i = 0; i < rangeIdx; i++) {
    // for each child of the paragraph that precedes our current range - add the length of it's content to the offset
    offset += paragraph.childNodes[i].textContent.length;
  }
  return offset;
}

/**
 * given an offset in a parent 'paragraph', return a child text node and child offset
 */
export function getChildTextNodeAndOffsetFromParentOffset(
  parent,
  parentOffset
) {
  let childOffset =
    parentOffset === -1 ? parent.textContent.length : parentOffset;
  const textNodesOnlyFlattened = [];
  const queue = [...parent.childNodes];
  while (queue.length) {
    const currentNode = queue.shift();
    if (currentNode.nodeType === DOM_TEXT_NODE_TYPE_ID) {
      textNodesOnlyFlattened.push(currentNode);
    }
    queue.unshift(...currentNode.childNodes);
  }
  let childNode;
  // assume 'parent' is a 'paragraph' with an id
  for (let i = 0; i < textNodesOnlyFlattened.length; i++) {
    childNode = textNodesOnlyFlattened[i];
    // assume max depth level one for text nodes AKA no tags within tags here for formatting
    if (childNode.textContent.length >= childOffset) {
      break;
    }
    childOffset -= childNode.textContent.length;
  }
  return [childNode, childOffset];
}

export function getFirstAncestorWithId(domNode) {
  if (!domNode) return;
  if (
    domNode.nodeType === DOM_ELEMENT_NODE_TYPE_ID &&
    domNode.getAttribute('name')
  )
    return domNode;
  // walk ancestors until one has a truthy 'name' attribute
  // 'name' === id in the db
  let current = domNode.parentElement;
  while (current && !current.getAttribute('name')) {
    current = current.parentElement;
  }
  return current;
}

// this is used to determine whether the caret will leave the current node
// if the user presses the up or down arrow
//
// return array of boolean - caret is at [top, right, bottom, left] of paragraph textContent
export function caretIsOnEdgeOfParagraphText() {
  const range = getRange();
  if (!range || !range.collapsed) {
    return false;
  }
  const currentParagraph = getFirstAncestorWithId(range.commonAncestorContainer);
  if (!currentParagraph) {
    console.warn("caretIsOnEdgeOfParagraphText can't find node!", range);
    return false;
  }
  const currentChildCaretOffset = range.startOffset;
  const currentChildParagraphContentOffset = getParagraphContentOffset(range.startContainer, currentParagraph)
  
  function compareRangeAndParagraphTopOrBottom(key) {
    const caretRect = range.getBoundingClientRect();
    const paragraphRect = currentParagraph.getBoundingClientRect();
    // if there's less than a caret height left when comparing the range rect to the paragraph rect,
    // we're on the top or bottom line of the paragraph text
    // TODO: this will probably break if adding margin or padding to the paragraph or any formatting <span>s
    return (Math.abs(paragraphRect[key] - caretRect[key])) < caretRect.height;
  }
  return [
    compareRangeAndParagraphTopOrBottom('top'),
    currentChildCaretOffset + currentChildParagraphContentOffset === currentParagraph.textContent.length,
    compareRangeAndParagraphTopOrBottom('bottom'),
    currentChildCaretOffset + currentChildParagraphContentOffset === 0,
  ];
}

export function getNodeId(node) {
  return node && node.getAttribute ? node.getAttribute('name') : null;
}

export function getNodeById(nodeId) {
  const [first] = document.getElementsByName(nodeId);
  return first;
}

export function getFirstHeadingContent() {
  const [h1] = document.querySelectorAll(`[data-type='${NODE_TYPE_H1}']`);
  return h1 ? h1.textContent : '';
}

export function isControlKey(code) {
  return [
    KEYCODE_TAB,
    KEYCODE_SHIFT_RIGHT,
    KEYCODE_SHIFT_OR_COMMAND_LEFT,
    KEYCODE_COMMAND_RIGHT,
    KEYCODE_ALT,
    KEYCODE_CTRL,
    KEYCODE_CAPS_LOCK,
    KEYCODE_ENTER,
    KEYCODE_ESC,
    KEYCODE_PAGE_UP,
    KEYCODE_PAGE_DOWN,
    KEYCODE_END,
    KEYCODE_HOME,
    KEYCODE_LEFT_ARROW,
    KEYCODE_UP_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_DOWN_ARROW,
    KEYCODE_F1,
    KEYCODE_F2,
    KEYCODE_F3,
    KEYCODE_F4,
    KEYCODE_F5,
    KEYCODE_F6,
    KEYCODE_F7,
    KEYCODE_F8,
    KEYCODE_F9,
    KEYCODE_F10,
    KEYCODE_F11,
    KEYCODE_F12,
    KEYCODE_PRINT_SCREEN
  ].includes(code);
}
