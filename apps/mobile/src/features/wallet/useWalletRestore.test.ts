import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { checkWalletNeedsRestore } from 'src/features/wallet/useWalletRestore'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

jest.mock('wallet/src/features/wallet/Keyring/Keyring', () => ({
  Keyring: {
    getAddressesForStoredPrivateKeys: jest.fn(),
    getMnemonicIds: jest.fn(),
  },
}))

describe('checkWalletNeedsRestore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns NoRestoreNeeded type when no mnemonic ID exists since there is no wallet to restore', async () => {
    expect(await checkWalletNeedsRestore(undefined, true)).toBe(WalletRestoreType.None)
    expect(await checkWalletNeedsRestore(undefined, false)).toBe(WalletRestoreType.None)
  })

  it('returns SeedPhrase type when private keys are present but no seed phrase is available', async () => {
    const mnemonicId = '123'
    jest.mocked(Keyring.getAddressesForStoredPrivateKeys).mockResolvedValue([mnemonicId])
    jest.mocked(Keyring.getMnemonicIds).mockResolvedValue([])
    expect(await checkWalletNeedsRestore(mnemonicId, true)).toBe(WalletRestoreType.SeedPhrase)
    expect(await checkWalletNeedsRestore(mnemonicId, false)).toBe(WalletRestoreType.None)
  })

  it('returns NewDevice type when no private keys or seed phrase is available', async () => {
    const mnemonicId = '123'
    jest.mocked(Keyring.getAddressesForStoredPrivateKeys).mockResolvedValue([])
    jest.mocked(Keyring.getMnemonicIds).mockResolvedValue([])
    expect(await checkWalletNeedsRestore(mnemonicId, true)).toBe(WalletRestoreType.NewDevice)
    expect(await checkWalletNeedsRestore(mnemonicId, false)).toBe(WalletRestoreType.NewDevice)
  })
})
