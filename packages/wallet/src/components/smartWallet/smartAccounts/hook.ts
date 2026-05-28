import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectHasDismissedSmartWalletHomeScreenNudge } from 'wallet/src/features/behaviorHistory/selectors'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useSmartWalletChains } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
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
    if (activeAccount?.type !== AccountType.SignerMnemonic || hasSmartWalletConsent) {
      setStatus(SmartWalletDelegationAction.None)
      setLoading(false)
      return
    }

    if (hasDismissedSmartWalletHomeScreenNudge && isSmartWalletUpgradeModal) {
      setStatus(SmartWalletDelegationAction.None)
      setLoading(false)
      return
    }

    for (const chain of enabledChains) {
      const result = getDelegationDetails(activeAccount.address, chain)
      if (result?.currentDelegationAddress && !result.isWalletDelegatedToUniswap) {
        setStatus(SmartWalletDelegationAction.ShowConflict)
        setLoading(false)
        return
      }
    }

    setStatus(SmartWalletDelegationAction.PromptUpgrade)
    setLoading(false)
  }, [
    activeAccount?.address,
    activeAccount?.type,
    enabledChains,
    hasDismissedSmartWalletHomeScreenNudge,
    hasSmartWalletConsent,
    isSmartWalletUpgradeModal,
    signerMnemonicAccounts,
    getDelegationDetails,
  ])

  if (!activeAccount) {
    return { status: SmartWalletDelegationAction.None, loading: false }
  }

  return { status, loading }
}
