import React from 'react';
import { List, Map } from 'immutable';
import {
  A,
  BoldText,
  Code,
  ItalicText,
  SiteInfo,
  StrikeText
} from './shared-styled-components';
import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC, SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH
} from '../constants';
import { getContentForSelection, getSelectionKey } from '../../pages/edit/selection-helpers';

export function getFormattedSelections(node) {
  const selections = node.getIn(['meta', 'selections'], List([Map()]));
  let children = [];
  selections.forEach((selection) => {
    try {
      const key = getSelectionKey(selection);
      let selectionJsx = getContentForSelection(node, selection);
      
      if (selection.get(SELECTION_ACTION_STRIKETHROUGH)) {
        selectionJsx = (<StrikeText key={key}>{selectionJsx}</StrikeText>)
      }
      if (selection.get(SELECTION_ACTION_SITEINFO)) {
        selectionJsx = (<SiteInfo key={key}>{selectionJsx}</SiteInfo>)
      }
      if (selection.get(SELECTION_ACTION_ITALIC)) {
        selectionJsx = (<ItalicText key={key}>{selectionJsx}</ItalicText>)
      }
      if (selection.get(SELECTION_ACTION_CODE)) {
        selectionJsx = (<Code key={key}>{selectionJsx}</Code>)
      }
      if (selection.get(SELECTION_ACTION_BOLD)) {
        selectionJsx = (<BoldText key={key}>{selectionJsx}</BoldText>)
      }
      if (selection.get(SELECTION_ACTION_LINK)) {
        selectionJsx = (<A key={key} href={selection.get('linkUrl')}>{selectionJsx}</A>)
      }
      children.push(selectionJsx);
    } catch (err) {
      console.warn(err);
      // selections got corrupt, just display unformatted text
      children = [node.get('content')];
    }
  })
  return children;
}

export function getFirstNode(nodesById) {
  const idSeen = new Set();
  const nextSeen = new Set();
  nodesById.forEach(node => {
    idSeen.add(node.get('id'));
    if (node.get('next_sibling_id')) {
      nextSeen.add(node.get('next_sibling_id'));
    }
  })
  const difference = new Set([...idSeen].filter(id => !nextSeen.has(id)))
  const [firstId] = [...difference];
  return nodesById.get(firstId);
}
