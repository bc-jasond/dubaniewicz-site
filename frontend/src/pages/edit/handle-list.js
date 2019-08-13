import { List, Map } from 'immutable';
import {
  NODE_TYPE_LI,
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_SPACER,
} from '../../common/constants';
import { cleanText } from '../../common/utils';
import { splitSelectionsAtCaretOffset } from './edit-selection-helpers';

export function handleBackspaceList(documentModel, selectedNodeId) {
  const selectedOl = documentModel.getParent(selectedNodeId);
  let prevSection;
  if (documentModel.isFirstChild(selectedNodeId)) {
    if (documentModel.isFirstChild(selectedOl.get('id'))) {
      const selectedSection = documentModel.getSection(selectedOl.get('id'));
      prevSection = documentModel.getPrevSibling(selectedSection.get('id'));
      // delete a spacer?
      if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
        const spacerSectionId = prevSection.get('id');
        prevSection = documentModel.getPrevSibling(spacerSectionId);
        documentModel.delete(spacerSectionId);
      }
      // overloading prevSection to mean 'prevParagraph' I know, I know...
      if (!documentModel.canFocusNode(prevSection.get('id'))) {
        prevSection = documentModel.getLastChild(prevSection.get('id'))
      }
    }
    if (prevSection.get('type') === NODE_TYPE_OL) {
      // merge OLs?
      documentModel.mergeSections(prevSection, selectedOl);
      const lastLi = documentModel.getLastChild(prevSection.get('id'));
      return [lastLi.get('id'), -1];
    }
    // convert 1st LI to P, H1, H2
    const wasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
    documentModel.mergeParagraphs(prevSection.get('id'), selectedNodeId);
    if (wasOnlyChild) {
      const section = documentModel.getSection(selectedOl.get('id'));
      // delete empty OL
      documentModel.delete(selectedOl.get('id'));
      if (documentModel.isOnlyChild(selectedOl.get('id'))) {
        // delete empty section
        documentModel.delete(section.get('id'))
      }
    }
    return [prevSection.get('id'), -1];
  }
  // merge LIs within the same list
  const prevSibling = documentModel.getPrevSibling(selectedNodeId);
  documentModel.mergeParagraphs(prevSibling.get('id'), selectedNodeId);
  return [prevSibling.get('id'), -1];
}

export function handleEnterList(documentModel, selectedNodeId, caretPosition, content) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  console.info('ENTER "list" content left: ', contentLeft, 'content right: ', contentRight);
  if (cleanText(contentLeft).length === 0 && documentModel.isLastChild(selectedNodeId)) {
    // create a P tag after the OL - only if empty LI is last child (allows empty LIs in the middle of list)
    const olId = documentModel.getParent(selectedNodeId).get('id');
    const wasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
    documentModel.delete(selectedNodeId);
    const pId = documentModel.insertSubSectionAfter(olId, NODE_TYPE_P, contentRight);
    if (wasOnlyChild) {
      documentModel.delete(olId);
    }
    return pId;
  }
  const selections = documentModel.getNode(selectedNodeId).getIn(['meta', 'selections'], List());
  const [leftSelections, rightSelections] = splitSelectionsAtCaretOffset(selections, caretPosition);
  let left = documentModel.getNode(selectedNodeId)
    .set('content', contentLeft);
  // TODO: make a more standard 'one place' to
  if (leftSelections.size > 0) {
    left.setIn(['meta', 'selections'], leftSelections)
  }
  documentModel.update(left);
  let rightMeta = Map();
  if (rightSelections.size > 0) {
    rightMeta = rightMeta.set('selections', rightSelections)
  }
  return documentModel.insertSubSectionAfter(selectedNodeId, NODE_TYPE_LI, contentRight, rightMeta);
}

export function insertList(documentModel, selectedNodeId) {
  const olId = documentModel.insertSubSectionAfter(selectedNodeId, NODE_TYPE_OL);
  const focusNodeId = documentModel.insert(olId, NODE_TYPE_LI, 0);
  documentModel.delete(selectedNodeId);
  return focusNodeId;
}