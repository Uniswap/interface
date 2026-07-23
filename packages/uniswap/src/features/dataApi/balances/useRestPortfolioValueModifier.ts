import type { PartialMessage } from '@bufbuild/protobuf'
import type {
  PoolRef,
  PortfolioValueModifier as RestPortfolioValueModifier,
} from '@uniswap/client-data-api/dist/data/v1/types_pb.d'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { RestContract } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { selectPositionsVisibility } from 'uniswap/src/features/visibility/selectors'
import { parsePositionId } from 'uniswap/src/features/visibility/utils'

export type RestTokenOverrides = {
  includeOverrides: RestContract[]
  excludeOverrides: RestContract[]
}

export type RestPoolOverrides = {
  poolIncludeOverrides: PartialMessage<PoolRef>[]
  poolExcludeOverrides: PartialMessage<PoolRef>[]
}

/**
 * Helps generate modifiers when requesting a portfolio for one or more addresses with our REST endpoint.
 * These modifiers control manual overrides for tokens that are included or excluded from portfolio calculations,
 * and whether to include small balances and spam tokens.
 * @param addresses single address or array of addresses
 * @returns Array of REST portfolio value modifiers to be passed into useGetPortfolioQuery
 */
export function useRestPortfolioValueModifiers(
  addresses?: Address[],
): PartialMessage<RestPortfolioValueModifier>[] | undefined {
  const addressArray = useMemo(() => addresses ?? [], [addresses])
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(addressArray)
  const positionsVisibility = useSelector(selectPositionsVisibility)
  const { isTestnetModeEnabled } = useEnabledChains()
  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()
  const includeSpamTokens = isTestnetModeEnabled || !hideSpamTokens
  const includeSmallBalances = !hideSmallBalances

  const modifiers = useMemo(() => {
    const { includeOverrides, excludeOverrides } = Object.entries(currencyIdToTokenVisibility).reduce(
      (acc: RestTokenOverrides, [key, tokenVisibility]) => {
        const contractInput = currencyIdToRestContractInput(key)
        tokenVisibility.isVisible ? acc.includeOverrides.push(contractInput) : acc.excludeOverrides.push(contractInput)

        return acc
      },
      {
        includeOverrides: [],
        excludeOverrides: [],
      },
    )

    // Legacy persisted entries lack chainId/poolId/tokenId on the value; parsePositionId
    // recovers them from the key. positionId on PoolRef lets the BE discriminate multiple
    // V3/V4 positions in the same pool; V2 omits it so the BE falls back to pool matching.
    const { poolIncludeOverrides, poolExcludeOverrides } = Object.entries(positionsVisibility).reduce(
      (acc: RestPoolOverrides, [positionId, positionVisibility]) => {
        const parsedFromId = parsePositionId(positionId)
        const chainId = positionVisibility.chainId ?? parsedFromId?.chainId
        const poolId = positionVisibility.poolId ?? parsedFromId?.poolId
        const tokenId = positionVisibility.tokenId ?? parsedFromId?.tokenId
        if (!chainId || !poolId) {
          return acc
        }
        const poolRef: PartialMessage<PoolRef> = { chainId, poolId, positionId: tokenId }
        positionVisibility.isVisible ? acc.poolIncludeOverrides.push(poolRef) : acc.poolExcludeOverrides.push(poolRef)
        return acc
      },
      {
        poolIncludeOverrides: [],
        poolExcludeOverrides: [],
      },
    )

    return addressArray.map((addr) => ({
      address: addr,
      includeOverrides,
      excludeOverrides,
      poolIncludeOverrides,
      poolExcludeOverrides,
      includeSmallBalances,
      includeSpamTokens,
    }))
  }, [currencyIdToTokenVisibility, positionsVisibility, addressArray, includeSmallBalances, includeSpamTokens])

  return modifiers.length > 0 ? modifiers : undefined
}

/**
 * Uses useRestPortfolioValueModifiers to return a single REST portfolio value modifier for a single address.
 */
export function useRestPortfolioValueModifier(
  address?: Address,
): PartialMessage<RestPortfolioValueModifier> | undefined {
  const addressArray = useMemo(() => (address ? [address] : undefined), [address])
  const modifiers = useRestPortfolioValueModifiers(addressArray)
  return modifiers?.[0] ?? undefined
}
