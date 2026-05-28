import { AccountType } from 'uniswap/src/features/accounts/types'
import { getNextDerivationIndex } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

describe('getNextDerivationIndex', () => {
  const createMockAccount = (derivationIndex: number): SignerMnemonicAccount => ({
    type: AccountType.SignerMnemonic,
    address: `0x${derivationIndex.toString().padStart(40, '0')}`,
    derivationIndex,
    mnemonicId: 'test-mnemonic',
    timeImportedMs: Date.now(),
    backups: [BackupType.Manual],
    pushNotificationsEnabled: true,
    smartWalletConsent: true,
  })

  it('should return 0 for empty accounts', () => {
    expect(getNextDerivationIndex([])).toBe(0)
  })

  it('should return next sequential index for consecutive accounts', () => {
    const accounts = [0, 1, 2].map(createMockAccount)
    expect(getNextDerivationIndex(accounts)).toBe(3)
  })

  it('should find first missing index in sequence', () => {
    const accounts = [0, 2, 3].map(createMockAccount)
    expect(getNextDerivationIndex(accounts)).toBe(1)
  })

  it('should handle gap at beginning', () => {
    const accounts = [1, 2, 3].map(createMockAccount)
    expect(getNextDerivationIndex(accounts)).toBe(0)
  })

  it('should handle multiple gaps and return first one', () => {
    const accounts = [0, 3, 7].map(createMockAccount)
    expect(getNextDerivationIndex(accounts)).toBe(1)
  })

  it('should handle non-sequential accounts with large gaps', () => {
    const accounts = [0, 5, 10].map(createMockAccount)
    expect(getNextDerivationIndex(accounts)).toBe(1)
  })
})
