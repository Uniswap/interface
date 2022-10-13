(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/* global WorkerGlobalScope */
function add(fn) {
  if (typeof WorkerGlobalScope === 'function' && self instanceof WorkerGlobalScope) {// this is run inside of a webworker
  } else {
    /**
     * if we are on react-native, there is no window.addEventListener
     * @link https://github.com/pubkey/unload/issues/6
     */
    if (typeof window.addEventListener !== 'function') return;
    /**
     * for normal browser-windows, we use the beforeunload-event
     */

    window.addEventListener('beforeunload', function () {
      fn();
    }, true);
    /**
     * for iframes, we have to use the unload-event
     * @link https://stackoverflow.com/q/47533670/3443137
     */

    window.addEventListener('unload', function () {
      fn();
    }, true);
  }
  /**
   * TODO add fallback for safari-mobile
   * @link https://stackoverflow.com/a/26193516/3443137
   */

}

var _default = {
  add: add
};
exports["default"] = _default;
},{}],2:[function(require,module,exports){
"use strict";

var unload = require('./index.js');

window['unload'] = unload;
},{"./index.js":3}],3:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.runAll = runAll;
exports.removeAll = removeAll;
exports.getSize = getSize;
exports["default"] = void 0;

var _detectNode = _interopRequireDefault(require("detect-node"));

var _browser = _interopRequireDefault(require("./browser.js"));

var _node = _interopRequireDefault(require("./node.js"));

var USE_METHOD = _detectNode["default"] ? _node["default"] : _browser["default"];
var LISTENERS = new Set();
var startedListening = false;

function startListening() {
  if (startedListening) return;
  startedListening = true;
  USE_METHOD.add(runAll);
}

function add(fn) {
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

function runAll() {
  var promises = [];
  LISTENERS.forEach(function (fn) {
    promises.push(fn());
    LISTENERS["delete"](fn);
  });
  return Promise.all(promises);
}

function removeAll() {
  LISTENERS.clear();
}

function getSize() {
  return LISTENERS.size;
}

var _default = {
  add: add,
  runAll: runAll,
  removeAll: removeAll,
  getSize: getSize
};
exports["default"] = _default;
},{"./browser.js":1,"./node.js":5,"@babel/runtime/helpers/interopRequireDefault":4,"detect-node":6}],4:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
module.exports = false;


},{}]},{},[2]);
