import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

type RemoveWalletConditions = {
  /**
   * The target account to remove. Will be undefined when replacing mnemonic as no single account is being targeted.
   */
  targetAccount?: Account
  /**
   * Remove mnemonic if it's replacing or there is only one signer mnemonic account left.
   * If account to remove is view only, we shouldn't remove mnemonic
   */
  shouldRemoveMnemonic: boolean
  hasAccountsLeftAfterRemoval: boolean
  accountsToRemove: Account[]
}

/**
 * Helper function used to determine the account(s) to remove, whether the mnemonic should be removed, and if accounts remain after removal.
 *
 * @param allAccounts - All accounts in the wallet
 * @param signerAccounts - Signer mnemonic accounts in the wallet
 * @param targetAddress - Targeted address of the account to remove
 * @param replaceMnemonic - Whether the mnemonic is being replaced
 * @returns
 */
export function determineRemoveWalletConditions({
  accountsMap,
  signerAccounts,
  targetAddress,
  replaceMnemonic = false,
}: {
  accountsMap: Record<string, Account>
  signerAccounts: SignerMnemonicAccount[]
  targetAddress?: Address
  replaceMnemonic?: boolean
}): RemoveWalletConditions {
  // When replacing the mnemonic, remove all signer accounts
  if (replaceMnemonic) {
    const hasViewOnlyAccounts = Object.keys(accountsMap).length > signerAccounts.length
    return {
      accountsToRemove: signerAccounts,
      hasAccountsLeftAfterRemoval: hasViewOnlyAccounts,
      shouldRemoveMnemonic: true,
    }
  }

  // If there's no target address, we shouldn't remove any accounts
  if (!targetAddress) {
    return {
      accountsToRemove: [],
      hasAccountsLeftAfterRemoval: true,
      shouldRemoveMnemonic: false,
    }
  }

  // Remove the specifically targeted account
  const targetAccount = accountsMap[targetAddress]
  const isTargetSignerAccount = signerAccounts.some((acc) =>
    // TODO(WALL-7065): Update to support solana
    areAddressesEqual({
      addressInput1: { address: targetAddress, platform: Platform.EVM },
      addressInput2: { address: acc.address, platform: Platform.EVM },
    }),
  )

  const accountsToRemove = targetAccount ? [targetAccount] : []
  const hasAccountsLeftAfterRemoval = Object.keys(accountsMap).length > accountsToRemove.length
  const targetAccountIsLastSignerAccount = isTargetSignerAccount && signerAccounts.length === 1

  return {
    accountsToRemove,
    targetAccount,
    hasAccountsLeftAfterRemoval,
    shouldRemoveMnemonic: targetAccountIsLastSignerAccount,
  }
}
