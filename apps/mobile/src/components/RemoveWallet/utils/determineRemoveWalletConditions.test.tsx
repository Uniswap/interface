import { determineRemoveWalletConditions } from 'src/components/RemoveWallet/utils/determineRemoveWalletConditions'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

describe('determineRemoveWalletConditions', () => {
  // Mock data setup
  const mockMnemonicId = 'test-mnemonic-id'
  const address1 = '0x1111111111111111111111111111111111111111'
  const address2 = '0x2222222222222222222222222222222222222222'
  const address3 = '0x3333333333333333333333333333333333333333'

  const signerAccount1: SignerMnemonicAccount = {
    type: AccountType.SignerMnemonic,
    address: address1,
    name: 'Signer Account 1',
    mnemonicId: mockMnemonicId,
    timeImportedMs: 1000,
    derivationIndex: 0,
    pushNotificationsEnabled: true,
  }

  const signerAccount2: SignerMnemonicAccount = {
    type: AccountType.SignerMnemonic,
    address: address2,
    name: 'Signer Account 2',
    mnemonicId: mockMnemonicId,
    timeImportedMs: 2000,
    derivationIndex: 1,
    pushNotificationsEnabled: true,
  }

  const viewOnlyAccount: Account = {
    type: AccountType.Readonly,
    address: address3,
    name: 'View Only Account',
    timeImportedMs: 3000,
    pushNotificationsEnabled: true,
  }

  test('when removing signer account with other signer accounts remaining, mnemonic should not be removed', () => {
    const targetAccountInput = signerAccount1
    const accountsMap = {
      [targetAccountInput.address]: targetAccountInput,
      [signerAccount2.address]: signerAccount2,
      [viewOnlyAccount.address]: viewOnlyAccount,
    }
    const signerAccounts = [signerAccount1, signerAccount2]

    const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
      determineRemoveWalletConditions({ accountsMap, signerAccounts, targetAddress: targetAccountInput.address })

    expect(targetAccount).toBe(targetAccount)
    expect(hasAccountsLeftAfterRemoval).toBe(true)
    expect(accountsToRemove).toEqual([targetAccount])
    expect(shouldRemoveMnemonic).toBe(false)
  })

  test('when removing the last signer account, mnemonic should be removed', () => {
    const targetAccountInput = signerAccount1
    const accountsMap = {
      [targetAccountInput.address]: targetAccountInput,
      [viewOnlyAccount.address]: viewOnlyAccount,
    }
    const signerAccounts = [targetAccountInput]

    const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
      determineRemoveWalletConditions({ accountsMap, signerAccounts, targetAddress: targetAccountInput.address })

    expect(targetAccount).toBe(targetAccountInput)
    expect(hasAccountsLeftAfterRemoval).toBe(true)
    expect(accountsToRemove).toEqual([targetAccountInput])
    expect(shouldRemoveMnemonic).toBe(true)
  })

  test('when replacing mnemonic, all signer accounts should be removed even if there are no remaining accounts', () => {
    const accountsMap = {
      [address1]: signerAccount1,
      [address2]: signerAccount2,
    }
    const signerAccounts = [signerAccount1, signerAccount2]
    const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
      determineRemoveWalletConditions({ accountsMap, signerAccounts, replaceMnemonic: true })

    expect(targetAccount).toBeUndefined()
    expect(hasAccountsLeftAfterRemoval).toBe(false)
    expect(accountsToRemove).toEqual([signerAccount1, signerAccount2])
    expect(shouldRemoveMnemonic).toBe(true)
  })

  test('when replacing mnemonic, all signer accounts should be removed, but view only accounts should remain', () => {
    const accountsMap = {
      [address1]: signerAccount1,
      [address2]: signerAccount2,
      [address3]: viewOnlyAccount,
    }
    const signerAccounts = [signerAccount1, signerAccount2]
    const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
      determineRemoveWalletConditions({ accountsMap, signerAccounts, replaceMnemonic: true })

    expect(targetAccount).toBeUndefined()
    expect(hasAccountsLeftAfterRemoval).toBe(true)
    expect(accountsToRemove).toEqual([signerAccount1, signerAccount2])
    expect(shouldRemoveMnemonic).toBe(true)
  })

  test('when removing a view-only account and there is 1 signer account remaining, mnemonic should not be removed', () => {
    const targetAccountInput = viewOnlyAccount
    const accountsMap = {
      [address1]: signerAccount1,
      [targetAccountInput.address]: targetAccountInput,
    }
    const signerAccounts = [signerAccount1]

    const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
      determineRemoveWalletConditions({ accountsMap, signerAccounts, targetAddress: targetAccountInput.address })

    expect(targetAccount).toBe(targetAccountInput)
    expect(hasAccountsLeftAfterRemoval).toBe(true)
    expect(accountsToRemove).toEqual([targetAccountInput])
    expect(shouldRemoveMnemonic).toBe(false)
  })

  test('when last account removed is view only account, mnemonic doesnt need to be removed and should not be removed', () => {
    const targetAccountInput = viewOnlyAccount
    const accountsMap = {
      [targetAccountInput.address]: targetAccountInput,
    }

    const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
      determineRemoveWalletConditions({ accountsMap, signerAccounts: [], targetAddress: targetAccountInput.address })

    expect(targetAccount).toBe(targetAccount)
    expect(hasAccountsLeftAfterRemoval).toBe(false)
    expect(accountsToRemove).toEqual([targetAccount])
    expect(shouldRemoveMnemonic).toBe(false)
  })

  test('when all accounts will be removed, mnemonic should be removed', () => {
    const targetAccountInput = signerAccount1
    const accountsMap = {
      [targetAccountInput.address]: targetAccountInput,
    }
    const signerAccounts = [targetAccountInput]

    const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
      determineRemoveWalletConditions({ accountsMap, signerAccounts, targetAddress: targetAccountInput.address })

    expect(targetAccount).toBe(targetAccountInput)
    expect(hasAccountsLeftAfterRemoval).toBe(false)
    expect(accountsToRemove).toEqual([targetAccountInput])
    expect(shouldRemoveMnemonic).toBe(true)
  })
})
