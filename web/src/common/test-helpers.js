function mockLocalStorage() {
  global.localStorageStorage = {};
  global.localStorage = {
    getItem: (k) => global.localStorageStorage[k],
    setItem: (k, v) => (global.localStorageStorage[k] = v),
    clear: () => (global.localStorageStorage = {}),
  };
}

function makeHistoryLogEntries(values) {
  return values.map(
    ([
      historyStateArg = [[]],
      executeNode = 'foo',
      executeStart = 0,
      unexecuteNode = 'foo',
      unexecuteStart = 0,
    ]) => {
      return {
        executeSelectionOffsets: {
          startNodeId: executeNode,
          caretStart: executeStart,
        },
        unexecuteSelectionOffsets: {
          startNodeId: unexecuteNode,
          caretStart: unexecuteStart,
        },
        historyState: historyStateArg.map(([executeState, unexecuteState]) => ({
          executeState,
          unexecuteState,
        })),
      };
    }
  );
}

module.exports = {
  mockLocalStorage,
  makeHistoryLogEntries,
};
