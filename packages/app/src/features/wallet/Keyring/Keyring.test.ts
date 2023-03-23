import { WebKeyring } from 'app/src/features/wallet/Keyring/Keyring.web'

const mockStore = ({
  data,
  failGet,
  failSet,
}: {
  data: Record<string, string>
  failGet?: boolean
  failSet?: boolean
}) =>
  ({
    get: () => (failGet ? Promise.reject('failed get') : Promise.resolve(data)),
    set: () => (failSet ? Promise.reject('failed set') : Promise.resolve()),
  } as unknown as chrome.storage.StorageArea)

describe(WebKeyring, () => {
  it('returns all mnemonic ids', async () => {
    const data = { 'com.uniswap.web.mnemonic.address1': 'my mnemonic' }
    const keyring = new WebKeyring(mockStore({ data }))

    const allMnemonics = await keyring.getMnemonicIds()

    expect(allMnemonics).toEqual(['address1'])
  })
})
