import chalk from 'chalk';
import immutable from 'immutable';

import {
  KEYCODE_SPACE,
  KEYCODE_SPACE_NBSP,
  ZERO_LENGTH_CHAR,
  HISTORY_MIN_NUM_CHARS,
} from '@filbert/constants';

const { Map } = immutable;

export const log = (...args) => console.log(...args);
export const error = (...args) => console.error(chalk.red(...args));
export const warn = (...args) => console.warn(chalk.yellow(...args));
export const info = (...args) => console.info(chalk.cyan(...args));
export const success = (...args) => console.log(chalk.green(...args));
export function saneEnvironmentOrExit(...requiredVars) {
  const { env } = process;
  const missingEnvVariables = requiredVars.filter((key) => !env[key] && key);
  if (missingEnvVariables.length > 0) {
    error(
      `❌ process.env not sane!\n\nThe following variables are missing:\n${missingEnvVariables.join(
        '\n'
      )}`
    );
    process.exit(1);
  }
}
export function moreThanNCharsAreDifferent(
  left,
  right,
  n = HISTORY_MIN_NUM_CHARS
) {
  let numDifferent = 0;
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }
  if (Math.abs(left.length - right.length) > n) {
    return true;
  }
  let j = 0;
  let k = 0;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const leftChar = left.charAt(j);
    const rightChar = right.charAt(k);
    if (!leftChar) {
      numDifferent += 1;
      k += 1;
    } else if (!rightChar) {
      numDifferent += 1;
      j += 1;
    } else if (leftChar !== rightChar) {
      numDifferent += 1;
      if (left.length === right.length) {
        j += 1;
        k += 1;
      } else if (left.length > right.length) {
        j += 1;
      } else {
        k += 1;
      }
    } else {
      j += 1;
      k += 1;
    }
    if (numDifferent > n) {
      return true;
    }
  }
  return false;
}

// TODO: use KEYCODE_SPACE to fix word-wrap issue, not sure what's going on but sometimes formatted lines don't break on words
export function cleanText(text = '') {
  // ensure no more than 1 space in a row
  let final = '';
  let last = -1;
  for (let i = 0; i < text.length; i++) {
    const currentChar = text.charAt(i);
    const current = text.charCodeAt(i);
    // don't allow:
    // 1) a space at the beginning
    // 2) a space at the end
    // 3) more than 1 space in a row
    if (
      current === KEYCODE_SPACE &&
      (i === 0 || i === text.length - 1 || last === KEYCODE_SPACE)
    ) {
      const nbsp = String.fromCharCode(KEYCODE_SPACE_NBSP);
      final += nbsp;
      last = nbsp;
    } else if (currentChar !== ZERO_LENGTH_CHAR) {
      final += currentChar;
      last = current;
    }
  }
  return final;
}
export function cleanTextOrZeroLengthPlaceholder(text) {
  const cleaned = cleanText(text);
  return cleaned.length > 0 ? cleaned : ZERO_LENGTH_CHAR;
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
export function deleteContentRange(content, startIdx, length) {
  if (length === 0 && startIdx > 0) {
    // delete the char behind the caret - assumes "Backspace"
    // TODO: handle "Del"
    return `${content.slice(0, startIdx - 1)}${content.slice(startIdx)}`;
  }
  // delete all highlighted chars in front of the caret
  return `${content.slice(0, startIdx)}${content.slice(startIdx + length)}`;
}

/**
 * returns a map of keyPath -> update value
 *
 * new value is an array for String types [start index, number of chars to delete to the right, new string]
 *
 * Map({
 *   'some.key.here':Number | undefined | [0,0,'new string']
 * })
 *
 *
 * @param left
 * @param right
 */
export function mapDiff(left, right) {
  if (!Map.isMap(left) || !Map.isMap(right)) {
    throw new Error('I only do Map()s');
  }
}
