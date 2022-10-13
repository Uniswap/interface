'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');
var zustand = require('zustand');

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
