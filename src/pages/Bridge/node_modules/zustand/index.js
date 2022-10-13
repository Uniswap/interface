'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var createStore = require('zustand/vanilla');
var react = require('react');
var useSyncExternalStoreExports = require('use-sync-external-store/shim/with-selector');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var createStore__default = /*#__PURE__*/_interopDefaultLegacy(createStore);
var useSyncExternalStoreExports__default = /*#__PURE__*/_interopDefaultLegacy(useSyncExternalStoreExports);

var useSyncExternalStoreWithSelector = useSyncExternalStoreExports__default["default"].useSyncExternalStoreWithSelector;
function useStore(api, selector, equalityFn) {
  if (selector === void 0) {
    selector = api.getState;
  }

  var slice = useSyncExternalStoreWithSelector(api.subscribe, api.getState, api.getServerState || api.getState, selector, equalityFn);
  react.useDebugValue(slice);
  return slice;
}

var createImpl = function createImpl(createState) {
  var api = typeof createState === 'function' ? createStore__default["default"](createState) : createState;

  var useBoundStore = function useBoundStore(selector, equalityFn) {
    return useStore(api, selector, equalityFn);
  };

  Object.assign(useBoundStore, api);
  return useBoundStore;
};

var create = function create(createState) {
  return createState ? createImpl(createState) : createImpl;
};

var create$1 = create;

Object.defineProperty(exports, 'createStore', {
  enumerable: true,
  get: function () { return createStore__default["default"]; }
});
exports["default"] = create$1;
exports.useStore = useStore;
Object.keys(createStore).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () { return createStore[k]; }
  });
});
