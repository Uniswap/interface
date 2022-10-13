import isNode from 'detect-node';
import BrowserMethod from './browser.js';
import NodeMethod from './node.js';
var USE_METHOD = isNode ? NodeMethod : BrowserMethod;
var LISTENERS = new Set();
var startedListening = false;

function startListening() {
  if (startedListening) return;
  startedListening = true;
  USE_METHOD.add(runAll);
}

export function add(fn) {
  startListening();
  if (typeof fn !== 'function') throw new Error('Listener is no function');
  LISTENERS.add(fn);
  var addReturn = {
    remove: function remove() {
      return LISTENERS["delete"](fn);
    },
    run: function run() {
      LISTENERS["delete"](fn);
      return fn();
    }
  };
  return addReturn;
}
export function runAll() {
  var promises = [];
  LISTENERS.forEach(function (fn) {
    promises.push(fn());
    LISTENERS["delete"](fn);
  });
  return Promise.all(promises);
}
export function removeAll() {
  LISTENERS.clear();
}
export function getSize() {
  return LISTENERS.size;
}
export default {
  add: add,
  runAll: runAll,
  removeAll: removeAll,
  getSize: getSize
};