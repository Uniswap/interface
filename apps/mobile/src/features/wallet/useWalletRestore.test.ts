import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { checkWalletNeedsRestore } from 'src/features/wallet/useWalletRestore'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

vi.mock('wallet/src/features/wallet/Keyring/Keyring', () => ({
  Keyring: {
    getAddressesForStoredPrivateKeys: vi.fn(),
    getMnemonicIds: vi.fn(),
  },
}))

describe('checkWalletNeedsRestore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns NoRestoreNeeded type when no mnemonic ID exists since there is no wallet to restore', async () => {
    expect(await checkWalletNeedsRestore(undefined, true)).toBe(WalletRestoreType.None)
    expect(await checkWalletNeedsRestore(undefined, false)).toBe(WalletRestoreType.None)
  })

  it('returns SeedPhrase type when private keys are present but no seed phrase is available', async () => {
    const mnemonicId = '123'
    vi.mocked(Keyring.getAddressesForStoredPrivateKeys).mockResolvedValue([mnemonicId])
    vi.mocked(Keyring.getMnemonicIds).mockResolvedValue([])
    expect(await checkWalletNeedsRestore(mnemonicId, true)).toBe(WalletRestoreType.SeedPhrase)
    expect(await checkWalletNeedsRestore(mnemonicId, false)).toBe(WalletRestoreType.None)
  })

  it('returns NewDevice type when no private keys or seed phrase is available', async () => {
    const mnemonicId = '123'
    vi.mocked(Keyring.getAddressesForStoredPrivateKeys).mockResolvedValue([])
    vi.mocked(Keyring.getMnemonicIds).mockResolvedValue([])
    expect(await checkWalletNeedsRestore(mnemonicId, true)).toBe(WalletRestoreType.NewDevice)
    expect(await checkWalletNeedsRestore(mnemonicId, false)).toBe(WalletRestoreType.NewDevice)
  })
})
