import { ChainId, Percent, Token } from '@ubeswap/sdk-core'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { OrderDirection } from 'graphql/data/util'
import { useDefaultActiveTokens } from 'hooks/Tokens'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

export function sortStakes(pools: TableStake[], sortState: StakeTableSortState) {
  return pools.sort((a, b) => {
    switch (sortState.sortBy) {
      case StakeSortFields.APR:
        return sortState.sortDirection === OrderDirection.Desc
          ? b.apr.greaterThan(a.apr)
            ? 1
            : -1
          : a.apr.greaterThan(b.apr)
          ? 1
          : -1
      case StakeSortFields.TVL:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
      default:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
    }
  })
}

export interface TableStake {
  hash: string
  stakingRewardAddress: string
  stakingToken: Token
  rewardTokens: Token[]
  tvl: number
  apr: Percent
  isActive: boolean
}

export enum StakeSortFields {
  TVL = 'TVL',
  APR = 'APR',
}

export type StakeTableSortState = {
  sortBy: StakeSortFields
  sortDirection: OrderDirection
}

function useFilteredStakes(pools: TableStake[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      pools.filter((pool) => {
        const hashIncludesFilterString = pool.hash.toLowerCase().includes(lowercaseFilterString)
        const addressIncludesFilterString = pool.stakingRewardAddress.toLowerCase().includes(lowercaseFilterString)
        const tokenIncludesFilterString = pool.stakingToken.symbol?.toLowerCase().includes(lowercaseFilterString)
        const poolName = `${pool.stakingToken?.symbol} Stake`.toLowerCase()
        const poolNameIncludesFilterString = poolName.includes(lowercaseFilterString)
        return (
          hashIncludesFilterString ||
          tokenIncludesFilterString ||
          addressIncludesFilterString ||
          poolNameIncludesFilterString
        )
      }),
    [lowercaseFilterString, pools]
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useStakes(sortState: StakeTableSortState, chainId?: ChainId) {
  const tokens = useDefaultActiveTokens(ChainId.CELO)
  const stakes = useMemo(() => {
    return [
      {
        stakingRewardAddress: '',
        stakingToken: tokens['0x71e26d0E519D14591b9dE9a0fE9513A398101490'],
        rewardTokens: [tokens['0x71e26d0E519D14591b9dE9a0fE9513A398101490']],
        tvl: 342_986,
        apr: new Percent(808, 10000),
        isActive: true,
      },
    ]
  }, [tokens])
  const loading = stakes.length == 0

  const unfilteredPools = useMemo(() => {
    const fff: TableStake[] = stakes.map((stake) => {
      return {
        hash: stake.stakingRewardAddress,
        stakingRewardAddress: stake.stakingRewardAddress,
        stakingToken: stake.stakingToken,
        rewardTokens: stake.rewardTokens,
        tvl: stake.tvl,
        apr: stake.apr,
        isActive: true,
      } as TableStake
    })

    const rt = sortStakes([...fff], sortState)
    console.log('inactive farms', rt)
    return rt
  }, [stakes, sortState])

  const filteredStakes = useFilteredStakes(unfilteredPools).slice(0, 100)
  return { stakes: filteredStakes, loading }
}
