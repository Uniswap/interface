import { useQuery } from '@tanstack/react-query'
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

interface StakeInfo {
  stakingRewardAddress: string
  stakingToken: string
  rewardTokens: string[]
  tvl: number
  apr: number
  isActive: boolean
}

async function fetchStakes(): Promise<StakeInfo[] | undefined> {
  try {
    const res = await fetch('https://interface-gateway.ubeswap.org/v1/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'Stakes',
        variables: {},
        query: '',
      }),
    })
    const data = await res.json()
    return data
  } catch (e) {
    console.log(e)
  }
  return
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useStakes(sortState: StakeTableSortState, chainId?: ChainId) {
  const tokens = useDefaultActiveTokens(ChainId.CELO)
  const { data: stakesBackend } = useQuery({
    queryKey: ['stakes'],
    queryFn: () => fetchStakes(),
    staleTime: 30_000,
  })

  const stakesFallback: StakeInfo[] = [
    {
      stakingRewardAddress: '0x388D611A57Ac15dCC1B937f287E5E908Ba5ff5c9',
      stakingToken: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
      rewardTokens: ['0x71e26d0E519D14591b9dE9a0fE9513A398101490'],
      tvl: 0,
      apr: 0,
      isActive: true,
    },
    {
      stakingRewardAddress: '0x8585A611521717Ffe7d93cF264DbE936E484DBa0',
      stakingToken: '0x7b97031b6297bc8e030B07Bd84Ce92FEa1B00c3e',
      rewardTokens: ['0x7b97031b6297bc8e030B07Bd84Ce92FEa1B00c3e'],
      tvl: 0,
      apr: 0,
      isActive: true,
    },
  ]

  const stakes = (stakesBackend || stakesFallback).map((stake) => ({
    stakingRewardAddress: stake.stakingRewardAddress,
    stakingToken: tokens[stake.stakingToken],
    rewardTokens: stake.rewardTokens.map((t) => tokens[t]),
    tvl: stake.tvl,
    apr: new Percent(Math.floor(stake.apr * 100), 10_000),
    isActive: stake.isActive,
  }))

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
    return rt
  }, [stakes, sortState])

  const filteredStakes = useFilteredStakes(unfilteredPools).slice(0, 100)
  return { stakes: filteredStakes, loading }
}
