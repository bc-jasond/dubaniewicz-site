// for document container
export const NODE_TYPE_ROOT = 'root';

export const PAGE_NAME_VIEW = 'p';
export const PAGE_NAME_EDIT = 'edit';
export const PAGE_NAME_PUBLIC = 'public';
export const PAGE_NAME_PRIVATE = 'private';
export const PAGE_NAME_MANAGE = 'manage';
export const PAGE_NAME_USER_PROFILE = 'user';

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

// sections that are containers only - no content
export const NODE_TYPE_CONTENT = 'content';
export const NODE_TYPE_OL = 'ol';
export const NODE_TYPE_CODE = 'code';

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
export const KEYCODE_SPACE = 32;
export const KEYCODE_PAGE_UP = 33;
export const KEYCODE_PAGE_DOWN = 34;
export const KEYCODE_END = 35;
export const KEYCODE_HOME = 36;
export const KEYCODE_LEFT_ARROW = 37;
export const KEYCODE_UP_ARROW = 38;
export const KEYCODE_RIGHT_ARROW = 39;
export const KEYCODE_DOWN_ARROW = 40;
export const KEYCODE_DEL = 46;
export const KEYCODE_V = 86;
export const KEYCODE_X = 88;
export const KEYCODE_Z = 90;
export const KEYCODE_Y = 89;
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
export const KEYCODE_SPACE_NBSP = 160;

// edit history actions (Commands)
export const NODE_ACTION_INSERT = 'insert';
export const NODE_ACTION_UPDATE = 'update';
export const NODE_ACTION_DELETE = 'delete';
export const NODE_ACTION_COMMIT = 'commit';
// these can be derived from the simpler actions above, should they have their own event and payload to make them atomic?
export const NODE_ACTION_CUT = 'cut';
export const NODE_ACTION_COPY = 'copy';
export const NODE_ACTION_PASTE = 'paste';
// might be useful to track every time the cursor moved with arrows or mouse click
export const NODE_ACTION_SELECTION = 'makeSelection';

// selection actions
export const SELECTION_NEXT = 'next';
export const SELECTION_LENGTH = 'length';
export const SELECTION_ACTION_BOLD = 'selection-bold';
export const SELECTION_ACTION_ITALIC = 'selection-italic';
export const SELECTION_ACTION_CODE = 'selection-code';
export const SELECTION_ACTION_SITEINFO = 'selection-siteinfo';
export const SELECTION_ACTION_MINI = 'selection-mini';
export const SELECTION_ACTION_STRIKETHROUGH = 'selection-strikethrough';
export const SELECTION_ACTION_LINK = 'selection-link';
export const SELECTION_ACTION_H1 = 'selection-h1';
export const SELECTION_ACTION_H2 = 'selection-h2';
export const SELECTION_LINK_URL = 'linkUrl';
// post level edits
export const POST_ACTION_REDIRECT_TIMEOUT = 1000;

// ENV
/* eslint-disable-next-line prefer-destructuring */
export const API_URL = process.env.API_URL || 'http://localhost:3001';

// AUTH
export const FILBERT_LOCALSTORAGE_NAMESPACE = 'filbert';
export const AUTH_TOKEN_KEY = 'token';
export const SESSION_KEY = 'session';
export const SESSION_THEME = 'theme';
export const SESSION_FONT = 'font';

// DOM
export const DOM_ELEMENT_NODE_TYPE_ID = 1;
export const DOM_TEXT_NODE_TYPE_ID = 3;
export const DOM_INPUT_TAG_NAME = 'INPUT';

// HISTORY - undo / redo
export const NODE_UPDATE_HISTORY = 'nodeUpdateHistory';
export const HISTORY_KEY_STATE = 'historyState';
export const HISTORY_KEY_UNEXECUTE_OFFSETS = 'unexecuteSelectionOffsets';
export const HISTORY_KEY_UNEXECUTE_STATES = 'unexecuteState';
export const HISTORY_KEY_EXECUTE_STATES = 'executeState';
export const HISTORY_KEY_EXECUTE_OFFSETS = 'executeSelectionOffsets';
export const HISTORY_MIN_NUM_CHARS = 6;

// THEME
export const DARK_MODE_THEME = 'dark';
export const LIGHT_MODE_THEME = 'light';
export const SANS_FONT_THEME = 'sans';
export const MIXED_FONT_THEME = 'mixed';