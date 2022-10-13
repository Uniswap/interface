import createStore__default from 'zustand/vanilla';
export * from 'zustand/vanilla';
export { default as createStore } from 'zustand/vanilla';
import { useDebugValue } from 'react';
import useSyncExternalStoreExports from 'use-sync-external-store/shim/with-selector.js';

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
var create$1 = create;

export { create$1 as default, useStore };
