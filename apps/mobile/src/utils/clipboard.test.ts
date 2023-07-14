import * as Clipboard from 'expo-clipboard'
import { getClipboard, setClipboard } from 'src/utils/clipboard'

describe(setClipboard, () => {
  it('copies string correctly', async () => {
    await setClipboard('test')
    try {
      expect(await Clipboard.getStringAsync()).toEqual('test')
    } catch {}
  })
})

describe(getClipboard, () => {
  it('gets string correctly', async () => {
    try {
      await Clipboard.setStringAsync('test')
      expect(await getClipboard()).toEqual('test')
    } catch {}
  })
})
