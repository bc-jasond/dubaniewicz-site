import { isKeyed, Map, Record } from 'immutable';

import {
  HISTORY_MIN_NUM_CHARS,
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_LENGTH,
  SELECTION_LINK_URL,
  SELECTION_NEXT,
  ZERO_LENGTH_CHAR,
} from '@filbert/selection';
import {
  HISTORY_MIN_NUM_CHARS,
  KEYCODE_SPACE,
  KEYCODE_SPACE_NBSP,
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_LENGTH,
  SELECTION_LINK_URL,
  SELECTION_NEXT,
  ZERO_LENGTH_CHAR,
} from './constants';

export function confirmPromise(msg) {
  return new Promise((resolve) => {
    if (confirm(msg)) {
      resolve(true);
      return;
    }
    resolve(false);
  });
}

export function formatPostDate(dateStr) {
  if (!dateStr) {
    return;
  }
  const publishedDate = new Date(dateStr);
  return publishedDate.toLocaleDateString('en-us', {
    // weekday: 'long',
    year: 'numeric',
    day: 'numeric',
    month: 'long',
  });
}

export function formatStreakDate(dateInt) {
  const date = new Date();
  date.setFullYear(parseInt(`${dateInt}`.substring(0, 4), 10));
  date.setMonth(parseInt(`${dateInt}`.substring(4, 6), 10));
  date.setDate(parseInt(`${dateInt}`.substring(6), 10));
  return date.toLocaleDateString('en-us', {
    // weekday: 'long',
    year: 'numeric',
    day: 'numeric',
    month: 'long',
  });
}

export function formatNumber(number) {
  return new Intl.NumberFormat().format(number);
}

export function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export function getMapWithId(obj) {
  const { id } = obj;
  return Map({ ...obj, id: id || s4() });
}

export function getCharFromEvent(evt) {
  // Firefox issue when typing fast - skip these.  NOTE: this could ignore composing characters for languages other than English
  //https://stackoverflow.com/a/25509350/1991322
  if (evt.key === 'Process') {
    return '';
  }
  if (evt && typeof evt.keyCode !== 'undefined') {
    // for normal "found on the keyboard" characters
    return evt.key;
  }
  // for OS X emoji keyboard insert
  return evt.data;
}

export function getCanonicalFromTitle(title) {
  let canonical = title
    // take first 25 chars
    .substring(0, 25)
    .toLowerCase()
    // remove all whitespace, replace with hyphen
    .replace(/\s+/g, '-')
    // keep only alpha numeric chars
    .replace(/[^0-9a-z-]/g, '');
  // append a hash
  canonical += `-${s4()}`;
  // dedupe hyphens
  return canonical.replace(/-+/g, '-');
}

export function deleteContentRange(content, startIdx, length) {
  if (length === 0 && startIdx > 0) {
    // delete the char behind the caret - assumes "Backspace"
    // TODO: handle "Del"
    return `${content.slice(0, startIdx - 1)}${content.slice(startIdx)}`;
  }
  // delete all highlighted chars in front of the caret
  return `${content.slice(0, startIdx)}${content.slice(startIdx + length)}`;
}

export function stopAndPrevent(evt) {
  if (evt && evt.stopPropagation && evt.preventDefault) {
    evt.stopPropagation();
    evt.preventDefault();
  }
}

export function usernameIsValid(maybeUsername) {
  return /^@[0-9a-z]{1,42}$/.test(maybeUsername);
}

export function idIsValid(maybeId) {
  return new RegExp(/[0-9a-f]{4}/).test(maybeId);
}

export function nodeIsValid(node) {
  return Map.isMap(node) && idIsValid(node.get('id'));
}

export function getFirstNode(nodesById) {
  const idSeen = new Set();
  const nextSeen = new Set();
  nodesById.forEach((node) => {
    idSeen.add(node.get('id'));
    if (node.get('next_sibling_id')) {
      nextSeen.add(node.get('next_sibling_id'));
    }
  });
  const difference = new Set([...idSeen].filter((id) => !nextSeen.has(id)));
  if (difference.size !== 1) {
    console.error(
      "DocumentError.getFirstNode() - more than one node isn't pointed to by another node!",
      difference
    );
  }
  const [firstId] = [...difference];
  return nodesById.get(firstId);
}

export function isBrowser() {
  return typeof window !== 'undefined';
}

export function getUrl(s) {
  try {
    const url = new URL(s);
    const urlString = url.toString();
    // URL().toString() adds the trailing / slash to the host portion of the url
    // this is annoying when you're typing
    // do a check to see if the end of the user input is a `/` and if not, strip it
    if (urlString.slice(-1) === '/' && s.slice(-1) !== '/') {
      return urlString.slice(0, -1);
    }
    return urlString;
  } catch (err) {
    return '';
  }
}
