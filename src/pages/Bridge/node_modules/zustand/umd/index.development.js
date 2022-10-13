(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('zustand/vanilla'), require('react'), require('use-sync-external-store/shim/with-selector')) :
  typeof define === 'function' && define.amd ? define(['exports', 'zustand/vanilla', 'react', 'use-sync-external-store/shim/with-selector'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.zustand = {}, global.zustandVanilla, global.React, global.useSyncExternalStoreShimWithSelector));
})(this, (function (exports, createStore, react, useSyncExternalStoreExports) { 'use strict';

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

  Object.defineProperty(exports, '__esModule', { value: true });

}));
