import { createMMKV } from 'react-native-mmkv'
// oxlint-disable-next-line universe-custom/no-relative-import-paths -- biome-parity: oxlint is stricter here
import { view } from './storybook.requires'

const mmkv = createMMKV({
  id: 'storybook-wallet',
})

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: (key): Promise<string | null> => Promise.resolve(mmkv.getString(key) || null),
    setItem: (key, value): Promise<void> => {
      mmkv.set(key, value)
      return Promise.resolve()
    },
  },
})

export default StorybookUIRoot
