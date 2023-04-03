import { WebKeyring } from 'app/src/features/wallet/Keyring/Keyring.web'

const mockStore = async ({ data }: { data: Record<string, string> }) => {
  await chrome.storage.local.set(data)
}

describe(WebKeyring, () => {
  it('returns all mnemonic ids', async () => {
    await mockStore({
      data: {
        'com.uniswap.web.mnemonic.address1': 'my mnemonic',
        'com.uniswap.web.mnemonic.address2': 'my mnemonic',
        'com.uniswap.web.privateKey.address3': 'private-key',
      },
    })
    const keyring = new WebKeyring()

    const allMnemonics = await keyring.getMnemonicIds()

    expect(allMnemonics).toEqual(['address1', 'address2'])
  })
})
