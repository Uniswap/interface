import { MMKV } from 'react-native-mmkv'
import { view } from './storybook.requires'

const mmkv = new MMKV({
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
