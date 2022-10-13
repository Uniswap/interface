System.register(['zustand/vanilla', 'react', 'use-sync-external-store/shim/with-selector'], (function (exports) {
  'use strict';
  var _starExcludes = {
    'default': 1,
    useStore: 1,
    createStore: 1
  };
  var createStore__default, useDebugValue, useSyncExternalStoreExports;
  return {
    setters: [function (module) {
      createStore__default = module["default"];
      var setter = { createStore: module["default"] };
      for (var name in module) {
        if (!_starExcludes[name]) setter[name] = module[name];
      }
      exports(setter);
    }, function (module) {
      useDebugValue = module.useDebugValue;
    }, function (module) {
      useSyncExternalStoreExports = module["default"];
    }],
    execute: (function () {

      exports('useStore', useStore);

      const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
      function useStore(api, selector = api.getState, equalityFn) {
        const slice = useSyncExternalStoreWithSelector(
          api.subscribe,
          api.getState,
          api.getServerState || api.getState,
          selector,
          equalityFn
        );
        useDebugValue(slice);
        return slice;
      }
      const createImpl = (createState) => {
        const api = typeof createState === "function" ? createStore__default(createState) : createState;
        const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
        Object.assign(useBoundStore, api);
        return useBoundStore;
      };
      const create = (createState) => createState ? createImpl(createState) : createImpl;
      var create$1 = exports('default', create);

    })
  };
}));
