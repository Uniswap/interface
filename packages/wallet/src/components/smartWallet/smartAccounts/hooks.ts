import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { DEFAULT_TOAST_HIDE_DELAY } from 'uniswap/src/features/notifications/constants'
import { useSuccessfulSwapCompleted } from 'uniswap/src/features/transactions/hooks/useSuccessfulSwapCompleted'
import { type TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  selectHasDismissedSmartWalletHomeScreenNudge,
  selectShouldShowPostSwapNudge,
} from 'wallet/src/features/behaviorHistory/selectors'
import { useSmartWalletChains } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useActiveAccount, useHasSmartWalletConsent, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { type WalletState } from 'wallet/src/state/walletReducer'

export enum SmartWalletDelegationAction {
  ShowConflict = 'Conflict',
  PromptUpgrade = 'PromptUpgrade',
  None = 'None',
}

export function useSmartWalletDelegationStatus({ overrideAddress }: { overrideAddress?: string } = {}): {
  status: SmartWalletDelegationAction
  loading: boolean
} {
  const [status, setStatus] = useState<SmartWalletDelegationAction>(SmartWalletDelegationAction.None)
  const [loading, setLoading] = useState<boolean>(true)

  // Only applies to signer mnemonic accounts
  const activeAccountFromRedux = useActiveAccount()
  const signerMnemonicAccounts = useSignerAccounts()
  const activeAccountFromOverride = overrideAddress
    ? signerMnemonicAccounts.find((account) => account.address === overrideAddress)
    : undefined
  const activeAccount =
    activeAccountFromOverride ||
    (activeAccountFromRedux?.type === AccountType.SignerMnemonic ? activeAccountFromRedux : undefined)

  const enabledChains = useSmartWalletChains()
  const hasSmartWalletConsent = useHasSmartWalletConsent()
  const { getDelegationDetails } = useWalletDelegationContext()

  const hasDismissedSmartWalletHomeScreenNudge = useSelector((state: WalletState) =>
    activeAccount ? selectHasDismissedSmartWalletHomeScreenNudge(state, activeAccount.address) : false,
  )

  useEffect(() => {
    if (!activeAccount) {
      return
    }

    try {
      if (hasDismissedSmartWalletHomeScreenNudge) {
        setStatus(SmartWalletDelegationAction.None)
        return
      }

      let hasExistingDelegation = false
      let hasNonUniswapDelegation = false
      for (const chain of enabledChains) {
        const result = getDelegationDetails(activeAccount.address, chain)
        if (result?.currentDelegationAddress) {
          hasExistingDelegation = true
          if (!result.isWalletDelegatedToUniswap) {
            hasNonUniswapDelegation = true
          }
        }
      }

      if (hasNonUniswapDelegation) {
        setStatus(SmartWalletDelegationAction.ShowConflict)
        return
      }

      if (hasSmartWalletConsent || hasExistingDelegation) {
        setStatus(SmartWalletDelegationAction.None)
        return
      }

      setStatus(SmartWalletDelegationAction.PromptUpgrade)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'useSmartWalletDelegationStatus', function: 'useEffect' },
      })
    } finally {
      setLoading(false)
    }
  }, [
    enabledChains,
    hasDismissedSmartWalletHomeScreenNudge,
    hasSmartWalletConsent,
    signerMnemonicAccounts,
    getDelegationDetails,
    activeAccount,
  ])

  if (!activeAccount) {
    return { status: SmartWalletDelegationAction.None, loading: false }
  }

  return { status, loading }
}

export function useOpenSmartWalletNudgeOnCompletedSwap(
  onSuccessfulSwapCompleted: (transaction: TransactionDetails) => void,
): void {
  const supportedSmartWalletChains = useSmartWalletChains()

  const isSmartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)
  const address = useActiveAccount()?.address
  const { status: delegationStatus } = useSmartWalletDelegationStatus()

  const canShowPostSwapNudge = useSelector((state: WalletState) =>
    address ? selectShouldShowPostSwapNudge(state, address) : false,
  )

  const handleSmartWalletNudge = useCallback(
    (transaction: TransactionDetails) => {
      if (!isSmartWalletEnabled || !address) {
        return
      }

      if (!supportedSmartWalletChains.includes(transaction.chainId)) {
        return
      }

      if (!canShowPostSwapNudge) {
        return
      }

      if (delegationStatus !== SmartWalletDelegationAction.PromptUpgrade) {
        return
      }

      setTimeout(() => {
        onSuccessfulSwapCompleted(transaction)
      }, DEFAULT_TOAST_HIDE_DELAY + ONE_SECOND_MS)
    },
    [
      address,
      canShowPostSwapNudge,
      delegationStatus,
      isSmartWalletEnabled,
      supportedSmartWalletChains,
      onSuccessfulSwapCompleted,
    ],
  )

  useSuccessfulSwapCompleted(handleSmartWalletNudge)
}
