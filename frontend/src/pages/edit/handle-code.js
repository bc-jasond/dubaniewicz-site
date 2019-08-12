import { List, Map } from 'immutable';
import {
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_SPACER,
} from '../../common/constants';
import { cleanText } from '../../common/utils';

export function handleBackspaceCode(documentModel, selectedNodeId) {
  const [selectedSectionId, idx] = selectedNodeId.split('-');
  const lineIdx = parseInt(idx, 10);
  let prevSection = documentModel.getPrevSibling(selectedSectionId);
  let prevFocusNodeId = documentModel.getPreviousFocusNodeId(selectedSectionId);
  const selectedSection = documentModel.getNode(selectedSectionId);
  const meta = selectedSection.get('meta', Map());
  const lines = meta.get('lines', List());
  const lineContent = cleanText(lines.get(lineIdx, ''));
  let prevLineContent = '';
  
  // delete the previous section?  Currently, only if CODE SECTION is empty and previous is a SPACER
  if (lines.size === 1 && lineContent.length === 0 && prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
    const spacerId = prevSection.get('id');
    prevFocusNodeId = documentModel.getPreviousFocusNodeId(spacerId);
    documentModel.delete(spacerId);
  }
  if (lines.size === 1 && lineContent.length === 0) {
    // delete CODE section - merge 2 CONTENT sections?
    prevSection = documentModel.getPrevSibling(selectedSectionId);
    const nextSection = documentModel.getNextSibling(selectedSectionId);
    documentModel.delete(selectedSectionId);
    if (prevSection.get('type') === NODE_TYPE_SECTION_CONTENT && nextSection.get('type') === NODE_TYPE_SECTION_CONTENT) {
      documentModel.mergeSections(prevSection, nextSection);
    }
  } else if (lineIdx > 0) {
    // merge lines of code
    prevLineContent = lines.get(lineIdx - 1);
    documentModel.update(
      selectedSection.set('meta',
        meta.set('lines',
          lines
            .delete(lineIdx)
            .set(lineIdx - 1, `${prevLineContent}${lineContent}`)
        )
      )
    )
  } else {
    //TODO: support convert/merge into other sections
    return [];
  }
  
  console.info('BACKSPACE - code section content: ', selectedSectionId, lineIdx);
  if (lineIdx > 0) {
    // a PRE was deleted, focus previous PRE
    return [`${selectedSectionId}-${lineIdx - 1}`, prevLineContent.length];
  }
  // the CODE_SECTION was deleted, focus previous section
  return [prevFocusNodeId, documentModel.getNode(prevFocusNodeId).get('content', '').length];
}

export function handleEnterCode(documentModel, selectedNode, contentLeft, contentRight) {
  const name = selectedNode.getAttribute('name');
  const [selectedSectionId, idx] = name.split('-');
  const lineIndex = parseInt(idx, 10);
  const selectedSection = documentModel.getNode(selectedSectionId);
  const meta = selectedSection.get('meta', Map());
  let lines = meta.get('lines', List());
  
  if (cleanText(contentLeft).length === 0 && lineIndex === (lines.size - 1)) {
    if (lines.size > 1) {
      // remove last line of code - leave at least one line
      documentModel.update(
        selectedSection.set('meta',
          meta.set('lines',
            lines.pop()
          )
        )
      );
    }
    // create a P tag (and optionally a CONTENT SECTION) after the OL - only if empty LI is last child (allows empty LIs in the middle of list)
    const nextSibling = documentModel.getNextSibling(selectedSectionId);
    let nextSiblingId;
    if (nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
      nextSiblingId = nextSibling.get('id');
    } else {
      // create a ContentSection
      nextSiblingId = documentModel.insertSectionAfter(selectedSectionId, NODE_TYPE_SECTION_CONTENT);
    }
    // add to existing content section
    return documentModel.insert(nextSiblingId, NODE_TYPE_P, 0, contentRight);
  }
  
  documentModel.update(
    selectedSection.set('meta',
      meta.set('lines',
        lines
          .set(lineIndex, contentLeft)
          .insert(lineIndex + 1, contentRight)
      )
    )
  );
  
  console.info('ENTER - code section content: ', contentLeft, contentRight, selectedSectionId, lineIndex);
  return `${selectedSectionId}-${lineIndex + 1}`;
}

export function handleDomSyncCode(documentModel, selectedNodeId, selectedNodeContent) {
  const [selectedSectionId, idx] = selectedNodeId.split('-');
  const lineIndex = parseInt(idx, 10);
  const selectedSection = documentModel.getNode(selectedSectionId);
  const meta = selectedSection.get('meta');
  let lines = meta.get('lines');
  const currentLineContent = lines.get(lineIndex);
  if (currentLineContent === selectedNodeContent) {
    return;
  }
  documentModel.update(
    selectedSection.set('meta',
      meta.set('lines', lines.set(lineIndex, selectedNodeContent))
    )
  );
}

export function insertCodeSection(documentModel, selectedNodeId) {
  const selectedSectionId = documentModel.getSection(selectedNodeId).get('id');
  const placeholderParagraphWasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
  if (!documentModel.isLastChild(selectedNodeId)) {
    documentModel.splitSection(selectedSectionId, selectedNodeId);
  }
  const newSectionId = documentModel.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_CODE,
  );
  documentModel.delete(selectedNodeId);
  if (placeholderParagraphWasOnlyChild) {
    documentModel.delete(selectedSectionId);
  }
  return newSectionId;
}