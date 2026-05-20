import { createMMKV } from 'react-native-mmkv'

// react-native-mmkv v4 renamed `delete(key)` → `remove(key)`, but
// apollo3-cache-persist's MMKVWrapper still calls `storage.delete(key)`
// from `removeItem`. Without this adapter, eviction would throw at runtime.
// (Also resolves the type-mismatch — no `any` cast needed.)
export function createMMKVApolloAdapter(): {
  set: (key: string, value: string | number | boolean) => void
  getString: (key: string) => string | undefined
  delete: (key: string) => void
} {
  const mmkv = createMMKV()
  return {
    set: (key, value) => mmkv.set(key, value),
    getString: (key) => mmkv.getString(key),
    delete: (key) => {
      mmkv.remove(key)
    },
  }
}
