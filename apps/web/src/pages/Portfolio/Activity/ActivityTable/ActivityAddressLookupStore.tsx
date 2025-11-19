import { buildActivityRowFragments } from 'pages/Portfolio/Activity/ActivityTable/registry'
import { useEffect, useMemo } from 'react'
import { useUnitagsAddressesQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

interface ActivityAddressLookupState {
  /** Map of address to Unitag username */
  unitagsMap: Map<Address, string>
  /** Whether Unitag lookups are still loading */
  isLoading: boolean
  /** Error from Unitag lookup query, if any */
  error: Error | undefined
  /** Set the lookup data */
  setLookupData: (data: { unitagsMap: Map<Address, string>; isLoading: boolean; error?: Error }) => void
}

/**
 * Zustand store for activity address lookups.
 * Batch fetches Unitags for all unique addresses in the activity table.
 * This avoids redundant API calls when the same address appears in multiple rows.
 */
const useActivityAddressLookupStore: UseBoundStore<StoreApi<ActivityAddressLookupState>> =
  create<ActivityAddressLookupState>((set) => ({
    unitagsMap: new Map(),
    isLoading: false,
    error: undefined,
    setLookupData: ({ unitagsMap, isLoading, error }) => set({ unitagsMap, isLoading, error }),
  }))

/**
 * Determines if a transaction type displays addresses (vs protocol info).
 * Send, Receive, and Approve show addresses; others typically show protocol.
 */
function showsAddressInCell(transactionType: TransactionType, hasProtocolInfo: boolean): boolean {
  // Send and Receive always show addresses
  if (transactionType === TransactionType.Send || transactionType === TransactionType.Receive) {
    return true
  }
  // Approve shows address (spender) if no protocol info
  if (transactionType === TransactionType.Approve && !hasProtocolInfo) {
    return true
  }
  // Other types show protocol info, not addresses
  return false
}

/**
 * Hook to initialize and update address lookups based on transactions.
 * Should be called at the table level to batch fetch all unique addresses.
 */
export function useActivityAddressLookup(transactions: TransactionDetails[]): void {
  // Extract unique EVM addresses from all transactions
  const uniqueAddresses = useMemo(() => {
    const addresses = new Set<Address>()

    transactions.forEach((tx) => {
      // Get counterparty from fragments
      const fragments = buildActivityRowFragments(tx)
      if (fragments.counterparty && isEVMAddress(fragments.counterparty)) {
        addresses.add(fragments.counterparty)
      }

      // Only include from address if counterparty is missing and transaction type shows addresses
      // This avoids unnecessary lookups for transactions that display protocol info instead
      const shouldShowAddress = showsAddressInCell(tx.typeInfo.type, Boolean(fragments.protocolInfo))
      if (!fragments.counterparty && shouldShowAddress && tx.from && isEVMAddress(tx.from)) {
        addresses.add(tx.from)
      }
    })

    return Array.from(addresses)
  }, [transactions])

  // Batch fetch Unitags for all unique addresses
  const {
    data: unitagsData,
    isLoading,
    error,
  } = useUnitagsAddressesQuery({
    params: uniqueAddresses.length > 0 ? { addresses: uniqueAddresses } : undefined,
  })

  // Create Unitag lookup map
  const unitagsMap = useMemo(() => {
    const map = new Map<Address, string>()
    if (unitagsData?.usernames) {
      Object.entries(unitagsData.usernames).forEach(([address, response]) => {
        if (response.username) {
          map.set(address, response.username)
        }
      })
    }
    return map
  }, [unitagsData])

  // Update store when data changes - Zustand handles equality checks
  useEffect(() => {
    useActivityAddressLookupStore.getState().setLookupData({
      unitagsMap,
      isLoading,
      error: error ?? undefined,
    })
  }, [unitagsMap, isLoading, error])
}

/**
 * Hook to access address lookup data from the store.
 * Returns the Unitag username for an address if available.
 */
export function useActivityAddressLookupValue(): {
  unitagsMap: Map<Address, string>
  isLoading: boolean
  error: Error | undefined
} {
  return useActivityAddressLookupStore(
    useShallow((state) => ({
      unitagsMap: state.unitagsMap,
      isLoading: state.isLoading,
      error: state.error,
    })),
  )
}
