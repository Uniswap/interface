import { QueryKey, queryOptions, UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { TradingApi } from '@universe/api'
import React, { useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_HOUR_MS } from 'utilities/src/time/time'
import { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import {
  doesAccountNeedDelegationForChain,
  isNonUniswapDelegation,
} from 'wallet/src/features/smartWallet/delegation/utils'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'

type DelegationDetailsByAccount = Record<Address, Partial<Record<UniverseChainId, DelegationCheckResult>>>

interface WalletDelegationContextType {
  // Get delegation details for a specific account and chain
  getDelegationDetails: (address: Address, chainId: UniverseChainId) => DelegationCheckResult | undefined
  // Force refresh of delegation data
  refreshDelegationData: () => Promise<void>
  // Is delegation data loading
  isLoading: boolean
  // Access to the full delegation query result
  delegationDataQuery: UseQueryResult<DelegationDetailsByAccount>
}

export const WalletDelegationContext = React.createContext<WalletDelegationContextType>({
  getDelegationDetails: () => undefined,
  refreshDelegationData: async () => {},
  delegationDataQuery: {} as UseQueryResult<DelegationDetailsByAccount>,
  isLoading: false,
})

export function useWalletDelegationContext(): WalletDelegationContextType {
  return useContext(WalletDelegationContext)
}

export function useGetDelegationDetails(): (address: Address, chainId: number) => DelegationCheckResult | undefined {
  const { getDelegationDetails } = useContext(WalletDelegationContext)
  return useEvent((address: Address, chainId: number) => {
    return getDelegationDetails(address, chainId)
  })
}

export function useGetSwapDelegationInfoForActiveAccount(): (chainId?: UniverseChainId) => SwapDelegationInfo {
  const activeAccount = useActiveAccount()
  const { getDelegationDetails } = useWalletDelegationContext()

  return useEvent((chainId?: UniverseChainId): SwapDelegationInfo => {
    if (!activeAccount || activeAccount.type !== AccountType.SignerMnemonic) {
      return {
        delegationAddress: undefined,
        delegationInclusion: false,
      }
    }
    if (!chainId) {
      return {
        delegationAddress: undefined,
        delegationInclusion: false,
      }
    }
    if (!activeAccount.smartWalletConsent) {
      return {
        delegationAddress: undefined,
        delegationInclusion: false,
      }
    }
    const delegationDetails = getDelegationDetails(activeAccount.address, chainId)
    return {
      delegationAddress: delegationDetails?.contractAddress,
      delegationInclusion: delegationDetails?.needsDelegation ?? false,
    }
  })
}

export function useGetSwapDelegationAddressForActiveAccount(): (chainId?: UniverseChainId) => Address | undefined {
  const activeAccount = useActiveAccount()
  const { getDelegationDetails } = useWalletDelegationContext()

  return useEvent((chainId?: UniverseChainId) => {
    if (!activeAccount || !chainId || activeAccount.type !== AccountType.SignerMnemonic) {
      return undefined
    }

    if (!activeAccount.smartWalletConsent) {
      return undefined
    }

    return getDelegationDetails(activeAccount.address, chainId)?.contractAddress
  })
}

interface WalletDelegationProviderProps {
  children: React.ReactNode
  pollingInterval?: number // in ms, defaults to 5 minutes
}

export function WalletDelegationProvider({
  children,
  pollingInterval = 5 * ONE_HOUR_MS,
}: WalletDelegationProviderProps): JSX.Element {
  const { chains } = useEnabledChains()

  // Get all signer mnemonic accounts instead of just active account
  const signerMnemonicAccounts = useSelector(selectSortedSignerMnemonicAccounts)
  const accountAddresses = useMemo(
    () => signerMnemonicAccounts.map((account) => account.address),
    [signerMnemonicAccounts],
  )

  // UniverseChainId is an enum where each value is a number
  const chainIds = useMemo(() => chains.map((chain) => chain.valueOf()), [chains])

  // Set up the React Query for delegation data
  const delegationQueryOptions = createDelegationQueryOptions({ accountAddresses, chainIds })
  const delegationQuery = useQuery({
    ...delegationQueryOptions,
    staleTime: pollingInterval,
    refetchInterval: pollingInterval,
    refetchOnMount: 'always',
  })
  const queryClient = useQueryClient()

  // Function to get delegation details for any account and chain
  const getDelegationDetails = useEvent(
    (address: Address, chainId: UniverseChainId): DelegationCheckResult | undefined => {
      // Get from cache first
      const cachedDelegationDetails = delegationQuery.data?.[address]?.[chainId]
      if (cachedDelegationDetails) {
        return cachedDelegationDetails
      }

      // Not in cache and not a signer account we're tracking
      const isTrackedAccount = accountAddresses.includes(address)
      if (!isTrackedAccount) {
        logger.error(new Error('Account is not tracked in WalletDelegationProvider'), {
          tags: { file: 'WalletDelegationProvider', function: 'getDelegationDetails' },
        })
        return undefined
      }

      // If still not in cache, refetch the query to update the cache
      delegationQuery.refetch().catch((error) => {
        logger.error(error, {
          tags: { file: 'WalletDelegationProvider', function: 'getDelegationDetails' },
        })
      })

      return undefined
    },
  )

  // Function to force refresh delegation data
  const refreshDelegationData = useEvent(async (): Promise<void> => {
    logger.debug('WalletDelegationProvider', 'refreshDelegationData', 'refreshing delegation data')
    await queryClient.invalidateQueries({ queryKey: delegationQueryOptions.queryKey })
    await queryClient.refetchQueries({ queryKey: delegationQueryOptions.queryKey })
  })

  const contextValue = useMemo(
    () => ({
      delegationData: delegationQuery.data,
      getDelegationDetails,
      refreshDelegationData,
      isLoading: delegationQuery.isLoading || delegationQuery.isFetching,
    }),
    [delegationQuery, getDelegationDetails, refreshDelegationData],
  )

  return (
    <WalletDelegationContext.Provider
      value={{
        ...contextValue,
        delegationDataQuery: delegationQuery,
      }}
    >
      {children}
    </WalletDelegationContext.Provider>
  )
}

export function getWalletDelegationQueryKey(accountAddresses: Address[], chainIds: UniverseChainId[]): QueryKey {
  return [ReactQueryCacheKey.WalletDelegation, ...accountAddresses, ...chainIds]
}

// input should only take what is needed to create the query key
// pass everything else to the callsite (eg useQuery)
export function createDelegationQueryOptions(input: {
  accountAddresses: Address[]
  chainIds: UniverseChainId[]
}): ReturnType<typeof queryOptions<TradingApi.WalletCheckDelegationResponseBody, Error, DelegationDetailsByAccount>> {
  return queryOptions<TradingApi.WalletCheckDelegationResponseBody, Error, DelegationDetailsByAccount>({
    queryKey: getWalletDelegationQueryKey(input.accountAddresses, input.chainIds),
    queryFn: () =>
      checkWalletDelegation({
        walletAddresses: input.accountAddresses,
        chainIds: input.chainIds.map((chainId) => chainId.valueOf()),
      }),
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    enabled: input.accountAddresses.length > 0 && input.chainIds.length > 0,
    // transform the API response to our internal structure
    select: selectDelegationDetailsByAccount,
  })
}

// Function to format delegation data for all signer accounts across all chains
const selectDelegationDetailsByAccount = (
  delegationResponse: Awaited<ReturnType<typeof checkWalletDelegation>>,
): DelegationDetailsByAccount => {
  logger.debug(
    'WalletDelegationProvider',
    'selectDelegationDetailsByAccount',
    'selecting delegation details by account',
  )
  // Transform the API response to our internal structure
  const delegationDetailsByAccount: DelegationDetailsByAccount = {}
  for (const address of Object.keys(delegationResponse.delegationDetails)) {
    delegationDetailsByAccount[address] = {}
    const addressToChainIdToDelegationDetails = delegationResponse.delegationDetails[address]
    if (!addressToChainIdToDelegationDetails) {
      continue
    }
    const chainIdToDelegationDetails: Partial<Record<UniverseChainId, DelegationCheckResult>> = {}
    for (const chainId of Object.keys(addressToChainIdToDelegationDetails)) {
      const delegationDetailsForAccountAndChain = addressToChainIdToDelegationDetails[chainId]
      if (!delegationDetailsForAccountAndChain) {
        continue
      }
      const supportedChainId = toSupportedChainId(Number(chainId))
      if (!supportedChainId) {
        continue
      }

      const { currentDelegationAddress, latestDelegationAddress, isWalletDelegatedToUniswap } =
        delegationDetailsForAccountAndChain

      // If delegated to another protocol, mark as not needing delegation
      if (isNonUniswapDelegation(delegationDetailsForAccountAndChain)) {
        chainIdToDelegationDetails[supportedChainId] = {
          needsDelegation: false,
          currentDelegationAddress,
          latestDelegationAddress,
          isWalletDelegatedToUniswap,
        }
        continue
      }

      // Otherwise, calculate if delegation is needed
      chainIdToDelegationDetails[supportedChainId] = {
        needsDelegation: doesAccountNeedDelegationForChain(delegationDetailsForAccountAndChain),
        contractAddress: latestDelegationAddress,
        currentDelegationAddress,
        latestDelegationAddress,
        isWalletDelegatedToUniswap,
      }
    }
    delegationDetailsByAccount[address] = chainIdToDelegationDetails
  }

  return delegationDetailsByAccount
}
