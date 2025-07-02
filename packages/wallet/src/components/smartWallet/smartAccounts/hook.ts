import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  selectHasDismissedSmartWalletHomeScreenNudge,
  selectShouldShowPostSwapNudge,
} from 'wallet/src/features/behaviorHistory/selectors'
import { DEFAULT_HIDE_DELAY } from 'wallet/src/features/notifications/components/NotificationToast'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useSmartWalletChains } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
import { useSuccessfulSwapCompleted } from 'wallet/src/features/transactions/hooks'
import { useActiveAccount, useHasSmartWalletConsent, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import { WalletState } from 'wallet/src/state/walletReducer'

export enum SmartWalletDelegationAction {
  ShowConflict = 'Conflict',
  PromptUpgrade = 'PromptUpgrade',
  None = 'None',
}

export function useSmartWalletDelegationStatus({
  isSmartWalletUpgradeModal = false,
  overrideAddress,
}: {
  isSmartWalletUpgradeModal?: boolean
  overrideAddress?: string
}): {
  status: SmartWalletDelegationAction
  loading: boolean
} {
  const [status, setStatus] = useState<SmartWalletDelegationAction>(SmartWalletDelegationAction.None)
  const [loading, setLoading] = useState<boolean>(true)

  const activeAccountFromRedux = useActiveAccount()
  const accounts = useSelector(selectAccounts)
  const activeAccountFromOverride = overrideAddress ? accounts[overrideAddress] : undefined
  const activeAccount = activeAccountFromOverride || activeAccountFromRedux

  const signerMnemonicAccounts = useSignerAccounts()
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

    if (hasDismissedSmartWalletHomeScreenNudge && isSmartWalletUpgradeModal) {
      setStatus(SmartWalletDelegationAction.None)
      setLoading(false)
      return
    }

    let isDelegatedOnlyToUniswapSmartContract = false
    for (const chain of enabledChains) {
      const result = getDelegationDetails(activeAccount.address, chain)

      if (result?.currentDelegationAddress && result.isWalletDelegatedToUniswap) {
        isDelegatedOnlyToUniswapSmartContract = true
      } else if (result?.currentDelegationAddress && !result.isWalletDelegatedToUniswap) {
        setStatus(SmartWalletDelegationAction.ShowConflict)
        setLoading(false)
        return
      }
    }

    if (activeAccount.type !== AccountType.SignerMnemonic || hasSmartWalletConsent) {
      setStatus(SmartWalletDelegationAction.None)
      setLoading(false)
      return
    }

    if (isDelegatedOnlyToUniswapSmartContract) {
      setStatus(SmartWalletDelegationAction.None)
      setLoading(false)
      return
    }

    setStatus(SmartWalletDelegationAction.PromptUpgrade)
    setLoading(false)
  }, [
    enabledChains,
    hasDismissedSmartWalletHomeScreenNudge,
    hasSmartWalletConsent,
    isSmartWalletUpgradeModal,
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
  const { status: delegationStatus } = useSmartWalletDelegationStatus({})

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
      }, DEFAULT_HIDE_DELAY + ONE_SECOND_MS)
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
