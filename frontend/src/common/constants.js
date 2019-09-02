export const NODE_TYPE_ROOT = 'root';
// sections for layout - can only be children of the root node 'blogContent'
export const NODE_TYPE_SECTION_H1 = 'h1';
export const NODE_TYPE_SECTION_H2 = 'h2';
export const NODE_TYPE_SECTION_SPACER = 'spacer';
export const NODE_TYPE_SECTION_CONTENT = 'content';

// opinionated sections - have fixed format, can't have children
export const NODE_TYPE_SECTION_CODE = 'codesection';
export const NODE_TYPE_SECTION_IMAGE = 'image';
export const NODE_TYPE_SECTION_QUOTE = 'quote';
export const NODE_TYPE_SECTION_POSTLINK = 'postlink';
export const NODE_TYPE_OL = 'ol';

// base nodes for content - must have a parent node of a section type
export const NODE_TYPE_P = 'p';
export const NODE_TYPE_PRE = 'pre';
export const NODE_TYPE_LI = 'li';

// @deprecated formatting nodes
export const NODE_TYPE_A = 'a';
export const NODE_TYPE_CODE = 'code';
export const NODE_TYPE_SITEINFO = 'siteinfo';
export const NODE_TYPE_ITALIC = 'italic';
export const NODE_TYPE_STRIKE = 'strike';
export const NODE_TYPE_BOLD = 'bold';
export const NODE_TYPE_LINK = 'link';
export const NODE_TYPE_TEXT = 'text';


// EDITOR
// TODO: this is a placeholder to be able to set the caret in an empty tag
export const NEW_POST_URL_ID = 'new';
export const ROOT_NODE_PARENT_ID = 'null';
export const ZERO_LENGTH_CHAR = '\u200B';
// key codes from a 2015 macbook 13" & Kinesis Advantage2
export const KEYCODE_BACKSPACE = 8;
export const KEYCODE_TAB = 9;
export const KEYCODE_ENTER = 13;
export const KEYCODE_SHIFT_RIGHT = 16;
export const KEYCODE_CTRL = 17;
export const KEYCODE_ALT = 18;
export const KEYCODE_CAPS_LOCK = 20;
export const KEYCODE_ESC = 27;
export const KEYCODE_PAGE_UP = 33;
export const KEYCODE_PAGE_DOWN = 34;
export const KEYCODE_END = 35;
export const KEYCODE_HOME = 36;
export const KEYCODE_LEFT_ARROW = 37;
export const KEYCODE_UP_ARROW = 38;
export const KEYCODE_RIGHT_ARROW = 39;
export const KEYCODE_DOWN_ARROW = 40;
export const KEYCODE_DEL = 46;
export const KEYCODE_SHIFT_OR_COMMAND_LEFT = 91;
export const KEYCODE_COMMAND_RIGHT = 93;
export const KEYCODE_F1 = 112;
export const KEYCODE_F2 = 113;
export const KEYCODE_F3 = 114;
export const KEYCODE_F4 = 115;
export const KEYCODE_F5 = 116;
export const KEYCODE_F6 = 117;
export const KEYCODE_F7 = 118;
export const KEYCODE_F8 = 119;
export const KEYCODE_F9 = 120;
export const KEYCODE_F10 = 121;
export const KEYCODE_F11 = 122;
export const KEYCODE_F12 = 123;
export const KEYCODE_PRINT_SCREEN = 124;

// edit actions
export const NODE_ACTION_INSERT = 'insert';
export const NODE_ACTION_UPDATE = 'update';
export const NODE_ACTION_DELETE = 'delete';
// selection actions
export const SELECTION_ACTION_BOLD = 'selection-bold';
export const SELECTION_ACTION_ITALIC = 'selection-italic';
export const SELECTION_ACTION_CODE = 'selection-code';
export const SELECTION_ACTION_SITEINFO = 'selection-siteinfo';
export const SELECTION_ACTION_STRIKETHROUGH = 'selection-strikethrough';
export const SELECTION_ACTION_LINK = 'selection-link';
export const SELECTION_ACTION_H1 = 'selection-h1';
export const SELECTION_ACTION_H2 = 'selection-h2';
export const SELECTION_LINK_URL = 'linkUrl';

// ENV
export const API_URL = process.env.API_URL;

// AUTH
export const AUTH_TOKEN_KEY = 'dubaniewicz-token';
export const SESSION_KEY = 'dubaniewicz-session';

// DOM
export const DOM_TEXT_NODE_TYPE_ID = 3;