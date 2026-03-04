import { useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { type WalletData, WalletStatus } from 'wallet/src/features/smartWallet/types'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useSignerMnemonicAccountsSorted } from 'wallet/src/features/wallet/hooks'
import { selectHasSmartWalletConsent } from 'wallet/src/features/wallet/selectors'
import { type WalletState } from 'wallet/src/state/walletReducer'

// Time window to treat a confirmed RemoveDelegation tx as still "pending" while delegation data refreshes
const RECENT_TX_THRESHOLD_MS = 60_000

export function useSmartWalletData(): WalletData[] {
  const accounts = useSignerMnemonicAccountsSorted()
  const { delegationDataQuery } = useWalletDelegationContext()

  const lastStableWallets = useRef<WalletData[]>([])

  const wallets = useMemo((): WalletData[] => {
    const delegationData = delegationDataQuery.data
    if (!delegationData || accounts.length === 0) {
      return []
    }

    return accounts.map((account) => {
      const walletDelegationData = delegationData[account.address]

      // Build active delegation network mapping from delegation context data
      const activeDelegationNetworkToAddress: WalletData['activeDelegationNetworkToAddress'] = {}

      if (walletDelegationData) {
        Object.entries(walletDelegationData).forEach(([chainId, delegationDetails]) => {
          const chainIdAsNumber = +chainId

          if (isUniverseChainId(chainIdAsNumber) && delegationDetails.currentDelegationAddress) {
            activeDelegationNetworkToAddress[chainIdAsNumber] = {
              delegationAddress: delegationDetails.currentDelegationAddress,
            }
          }
        })
      }

      // Determine wallet status based on delegation state
      let status = WalletStatus.Inactive

      if (walletDelegationData) {
        // Check for mismatched delegations first (delegated but not to Uniswap)
        const hasMismatchedDelegations = Object.values(walletDelegationData).some(
          (details) => details.currentDelegationAddress && !details.isWalletDelegatedToUniswap,
        )

        if (hasMismatchedDelegations) {
          // Mismatched delegations take priority - wallet is unavailable
          status = WalletStatus.Unavailable
        } else {
          // For Active/Inactive, check user consent instead of actual delegation status
          status = WalletStatus.Inactive // We'll update this with consent logic in the selector below
        }
      }

      return {
        name: account.name || account.address,
        walletAddress: account.address,
        activeDelegationNetworkToAddress,
        status,
      }
    })
  }, [accounts, delegationDataQuery.data])

  // Build a set of wallet addresses that have recent RemoveDelegation transactions (any status).
  // This covers the gap between tx submission and delegation API refresh. We check addedTime
  // rather than status or receipt.confirmedTime because the tx may pass through intermediate
  // statuses (Failed via Trading API before receipt corrects to Success) that would cause flicker.
  const addressesWithRemoveDelegation = useSelector((state: WalletState) => {
    const now = Date.now()
    const addresses = new Set<string>()
    for (const [address, chainTxs] of Object.entries(state.transactions)) {
      const hasRemoveDelegation = Object.values(chainTxs ?? {}).some((txsForChain) =>
        Object.values(txsForChain).some(
          (tx) => tx.typeInfo.type === TransactionType.RemoveDelegation && now - tx.addedTime < RECENT_TX_THRESHOLD_MS,
        ),
      )
      if (hasRemoveDelegation) {
        addresses.add(normalizeAddress(address, AddressStringFormat.Lowercase))
      }
    }
    return addresses
  })

  // Now use useSelector to get consent status for each wallet and update status
  const derivedWallets = useSelector((state: WalletState) =>
    wallets.map((wallet) => {
      const hasConsent = selectHasSmartWalletConsent(state, wallet.walletAddress)

      let derivedStatus = wallet.status

      if (wallet.status === WalletStatus.Inactive && hasConsent) {
        derivedStatus = WalletStatus.Active
      }

      // No consent, but has active delegations to Uniswap
      if (
        wallet.status === WalletStatus.Inactive &&
        !hasConsent &&
        Object.keys(wallet.activeDelegationNetworkToAddress).length > 0
      ) {
        derivedStatus = WalletStatus.ActionRequired
      }

      // Override ActionRequired with Pending when RemoveDelegation transactions exist
      if (
        derivedStatus === WalletStatus.ActionRequired &&
        addressesWithRemoveDelegation.has(normalizeAddress(wallet.walletAddress, AddressStringFormat.Lowercase))
      ) {
        derivedStatus = WalletStatus.Pending
      }

      if (wallet.status !== derivedStatus) {
        return {
          ...wallet,
          status: derivedStatus,
        }
      }

      return wallet
    }),
  )

  // prevents a flicker when delegation data is loading for an updated wallet
  if (!delegationDataQuery.isLoading && !delegationDataQuery.isFetching) {
    lastStableWallets.current = derivedWallets
  }

  return delegationDataQuery.isLoading || delegationDataQuery.isFetching ? lastStableWallets.current : derivedWallets
}
