import { createSelector, Selector } from '@reduxjs/toolkit'
import { RankingType } from '@universe/api'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Account, ReadOnlyAccount, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'
import { WalletState } from 'wallet/src/state/walletReducer'

const DEFAULT_TOKENS_ORDER_BY = RankingType.Volume

export const selectAccounts = (state: WalletState): Record<string, Account> => state.wallet.accounts

export const selectSignerMnemonicAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic),
)

export const selectSortedSignerMnemonicAccounts = createSelector(selectSignerMnemonicAccounts, (accounts) =>
  accounts.sort((a, b) => (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex),
)

export const selectSignerMnemonicAccountExists = createSelector(
  selectAccounts,
  (accounts) => Object.values(accounts).findIndex((value) => value.type === AccountType.SignerMnemonic) >= 0,
)

export const selectViewOnlyAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a): a is ReadOnlyAccount => a.type === AccountType.Readonly),
)

export const selectSortedViewOnlyAccounts = createSelector(selectViewOnlyAccounts, (accounts) =>
  accounts.sort((a, b) => a.timeImportedMs - b.timeImportedMs),
)

// Sorted signer accounts, then sorted view-only accounts
export const selectAllAccountsSorted = createSelector(
  selectSortedSignerMnemonicAccounts,
  selectSortedViewOnlyAccounts,
  (signerMnemonicAccounts, viewOnlyAccounts) => {
    return [...signerMnemonicAccounts, ...viewOnlyAccounts]
  },
)

export const selectAllSignerMnemonicAccountAddresses = createSelector(
  selectSortedSignerMnemonicAccounts,
  (signerMnemonicAccounts) => signerMnemonicAccounts.map((account) => account.address),
)

export const selectActiveAccountAddress = (state: WalletState): string | null => state.wallet.activeAccountAddress
export const selectActiveAccount = createSelector(
  selectAccounts,
  selectActiveAccountAddress,
  (accounts, activeAccountAddress) => (activeAccountAddress ? accounts[activeAccountAddress] : null) ?? null,
)

export const selectFinishedOnboarding = (state: WalletState): boolean | undefined => state.wallet.finishedOnboarding

export const selectTokensOrderBy = (state: WalletState): ExploreOrderBy =>
  state.wallet.settings.tokensOrderBy ?? DEFAULT_TOKENS_ORDER_BY

export const selectInactiveAccounts = createSelector(
  selectActiveAccountAddress,
  selectAccounts,
  (activeAddress, accounts) => Object.values(accounts).filter((account) => account.address !== activeAddress),
)

export const makeSelectAccountNotificationSetting = (): Selector<WalletState, boolean, [Address]> =>
  createSelector(
    selectAccounts,
    (_: WalletState, address: Address) => address,
    (accounts, address) => !!accounts[address]?.pushNotificationsEnabled,
  )

export const selectAnyAddressHasNotificationsEnabled = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).some((account) => account.pushNotificationsEnabled),
)

export const selectWalletSwapProtectionSetting = (state: WalletState): SwapProtectionSetting =>
  state.wallet.settings.swapProtection

export const appRatingProvidedMsSelector = (state: WalletState): number | undefined => state.wallet.appRatingProvidedMs
export const appRatingPromptedMsSelector = (state: WalletState): number | undefined => state.wallet.appRatingPromptedMs
export const appRatingFeedbackProvidedMsSelector = (state: WalletState): number | undefined =>
  state.wallet.appRatingFeedbackProvidedMs

export const selectHasBalanceOrActivityForAddress = (state: WalletState, address: Address): boolean | undefined =>
  state.wallet.accounts[address]?.hasBalanceOrActivity

export const selectHasSmartWalletConsent = createSelector(
  selectAccounts,
  (_: WalletState, address: Address) => address,
  (accounts, address) => {
    const account = accounts[address]
    return account?.type === AccountType.SignerMnemonic && account.smartWalletConsent === true
  },
)

export const selectAndroidCloudBackupEmail = (state: WalletState): string | null => state.wallet.androidCloudBackupEmail
