import { ChainId, Fraction, Percent, Token } from '@ubeswap/sdk-core'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { formatEther } from 'ethers/lib/utils'
import { OrderDirection } from 'graphql/data/util'
import { useDefaultActiveTokens } from 'hooks/Tokens'
import { useAtomValue } from 'jotai/utils'
import { useFarmRegistry } from 'pages/Farm/data/useFarmRegistry'
import { useMemo } from 'react'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isAddress } from 'utilities/src/addresses'

export function sortFarms(pools: TableFarm[], sortState: FarmTableSortState) {
  return pools.sort((a, b) => {
    switch (sortState.sortBy) {
      case FarmSortFields.APR:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.apr.greaterThan(a.apr)
            ? 1
            : -1
          : a.apr.greaterThan(b.apr)
          ? 1
          : -1
      case FarmSortFields.TVL:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
      default:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
    }
  })
}

export const V2_BIPS = 3000

export interface TableFarm {
  hash: string
  farmAddress: string
  token0: Token
  token1: Token
  token0Amount: Fraction
  token1Amount: Fraction
  tvl: number
  apr: Percent
  feeTier: number
  protocolVersion: ProtocolVersion
}

export enum FarmSortFields {
  TVL = 'TVL',
  APR = 'APR',
}

export type FarmTableSortState = {
  sortBy: FarmSortFields
  sortDirection: OrderDirection
}

function useFilteredFarms(pools: TableFarm[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      pools.filter((pool) => {
        const addressIncludesFilterString = pool.hash.toLowerCase().includes(lowercaseFilterString)
        const token0IncludesFilterString = pool.token0?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token1IncludesFilterString = pool.token1?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token0HashIncludesFilterString = pool.token0?.address?.toLowerCase().includes(lowercaseFilterString)
        const token1HashIncludesFilterString = pool.token1?.address?.toLowerCase().includes(lowercaseFilterString)
        const poolName = `${pool.token0?.symbol}/${pool.token1?.symbol}`.toLowerCase()
        const poolNameIncludesFilterString = poolName.includes(lowercaseFilterString)
        return (
          token0IncludesFilterString ||
          token1IncludesFilterString ||
          addressIncludesFilterString ||
          token0HashIncludesFilterString ||
          token1HashIncludesFilterString ||
          poolNameIncludesFilterString
        )
      }),
    [lowercaseFilterString, pools]
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useInactiveFarms(sortState: FarmTableSortState, chainId?: ChainId) {
  const farms = useFarmRegistry()
  const tokens = useDefaultActiveTokens(ChainId.CELO)
  const loading = farms.length == 0

  const unfilteredPools = useMemo(() => {
    const fff: TableFarm[] =
      farms
        .filter((farm) => farm.stakingAddress.toLowerCase() != '0x534408e91d755a0d898e1c508e987e8d0615b52c')
        .map((farm) => {
          const token0Address = isAddress(farm.token0Address)
          const token1Address = isAddress(farm.token1Address)
          if (token0Address && tokens[token0Address] && token1Address && tokens[token1Address]) {
            console.log('farm', farm)
            return {
              hash: farm.stakingAddress,
              farmAddress: farm.stakingAddress,
              token0: tokens[token0Address],
              token1: tokens[token1Address],
              token0Amount: new Fraction(0),
              token1Amount: new Fraction(0),
              tvl: farm.tvlUSD ? Number(formatEther(farm.tvlUSD)) : 0,
              apr: new Percent(0),
              feeTier: V2_BIPS,
              protocolVersion: 'V2',
            } as TableFarm
          }
          console.log(farm, token0Address, token1Address)
          console.error('this should not happen')
          return []
        })
        .flat() ?? []

    const rt = sortFarms([...fff], sortState)
    console.log('inactive farms', rt)
    return rt
  }, [farms, tokens, sortState])

  const filteredFarms = useFilteredFarms(unfilteredPools).slice(0, 100)
  return { farms: filteredFarms, loading }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useActiveFarms(sortState: FarmTableSortState, chainId?: ChainId) {
  const farms = useFarmRegistry()
  const tokens = useDefaultActiveTokens(ChainId.CELO)
  const loading = farms.length == 0

  const unfilteredPools = useMemo(() => {
    const fff: TableFarm[] =
      farms
        .filter((farm) => farm.stakingAddress.toLowerCase() == '0x534408e91d755a0d898e1c508e987e8d0615b52c')
        .map((farm) => {
          const token0Address = isAddress(farm.token0Address)
          const token1Address = isAddress(farm.token1Address)
          if (token0Address && tokens[token0Address] && token1Address && tokens[token1Address]) {
            console.log('farm', farm)
            return {
              hash: farm.stakingAddress,
              farmAddress: farm.stakingAddress,
              token0: tokens[token0Address],
              token1: tokens[token1Address],
              token0Amount: new Fraction(0),
              token1Amount: new Fraction(0),
              tvl: farm.tvlUSD ? Number(formatEther(farm.tvlUSD)) : 0,
              apr: farm.apr,
              feeTier: V2_BIPS,
              protocolVersion: 'V2',
            } as TableFarm
          }
          console.log(farm, token0Address, token1Address)
          console.error('this should not happen')
          return []
        })
        .flat() ?? []

    const rt = sortFarms([...fff], sortState)
    console.log('active farms', rt)
    return rt
  }, [farms, tokens, sortState])

  const filteredFarms = useFilteredFarms(unfilteredPools).slice(0, 100)
  return { farms: filteredFarms, loading }
}
