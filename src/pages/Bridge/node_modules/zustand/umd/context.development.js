(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('zustand')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'zustand'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.zustandContext = {}, global.React, global.zustand));
})(this, (function (exports, react, zustand) { 'use strict';

  function createContext() {
    var ZustandContext = react.createContext(undefined);

    var Provider = function Provider(_ref) {
      var createStore = _ref.createStore,
          children = _ref.children;
      var storeRef = react.useRef();

      if (!storeRef.current) {
        storeRef.current = createStore();
      }

      return react.createElement(ZustandContext.Provider, {
        value: storeRef.current
      }, children);
    };

    var useBoundStore = function useBoundStore(selector, equalityFn) {
      var store = react.useContext(ZustandContext);

      if (!store) {
        throw new Error('Seems like you have not used zustand provider as an ancestor.');
      }

      return zustand.useStore(store, selector, equalityFn);
    };

    var useStoreApi = function useStoreApi() {
      var store = react.useContext(ZustandContext);

      if (!store) {
        throw new Error('Seems like you have not used zustand provider as an ancestor.');
      }

      return react.useMemo(function () {
        return {
          getState: store.getState,
          setState: store.setState,
          subscribe: store.subscribe,
          destroy: store.destroy
        };
      }, [store]);
    };

    return {
      Provider: Provider,
      useStore: useBoundStore,
      useStoreApi: useStoreApi
    };
  }

  exports["default"] = createContext;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
