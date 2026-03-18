import { MMKV } from 'react-native-mmkv'

const mmkv = new MMKV()

export const statsigMMKVStorageProvider = {
  isReady: (): boolean => true,
  isReadyResolver: (): null => null,
  getProviderName: (): string => 'MMKV',
  getAllKeys: (): string[] => mmkv.getAllKeys(),
  getItem: (key: string): string | null => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string): void => mmkv.set(key, value),
  removeItem: (key: string): void => mmkv.delete(key),
}
