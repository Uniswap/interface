import { Token } from '@pollum-io/sdk-core'
import { ChainId } from '@pollum-io/smart-order-router'
import { GAMMA_MASTERCHEF_ADDRESSES, PSYS_ADDRESS } from 'constants/addresses'
import { BigNumber } from 'ethers/lib/ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useFetchedTokenData } from 'graphql/tokens/TokenData'
import { useMasterChefContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { ParsedQs } from 'qs'
import { useEffect, useMemo, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { GammaPairTokens, GlobalConst, MINICHEF_ABI } from './constants'

const { v3FarmSortBy } = GlobalConst.utils

export const farmFilters = [
  {
    text: 'All Farms',
    id: GlobalConst.utils.v3FarmFilter.allFarms,
  },
  {
    text: 'Stablecoins',
    id: GlobalConst.utils.v3FarmFilter.stableCoin,
  },
  {
    text: 'Blue Chips',
    id: GlobalConst.utils.v3FarmFilter.blueChip,
  },
  {
    text: 'Stable LPs',
    id: GlobalConst.utils.v3FarmFilter.stableLP,
  },
  {
    text: 'Other LPs',
    id: GlobalConst.utils.v3FarmFilter.otherLP,
  },
]

export const sortColumns = [
  {
    text: 'pool',
    index: GlobalConst.utils.v3FarmSortBy.pool,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'tvl',
    index: GlobalConst.utils.v3FarmSortBy.tvl,
    width: 0.2,
    justify: 'flex-start',
  },
  {
    text: 'rewards',
    index: GlobalConst.utils.v3FarmSortBy.rewards,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'apr',
    index: GlobalConst.utils.v3FarmSortBy.apr,
    width: 0.2,
    justify: 'flex-start',
  },
]

export const tabsFarm = [
  {
    text: 'My Farms',
    id: 0,
    link: 'my-farms',
  },
  {
    text: 'Gamma Farms',
    id: 1,
    link: 'gamma-farms',
    hasSeparator: true,
  },
]

export const tabsFarmDefault = [
  {
    text: 'My Farms',
    id: 0,
    link: 'my-farms',
  },
]

export const sortColumnsGamma = [
  {
    text: 'pool',
    index: v3FarmSortBy.pool,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'tvl',
    index: v3FarmSortBy.tvl,
    width: 0.2,
    justify: 'flex-start',
  },
  {
    text: 'rewards',
    index: v3FarmSortBy.rewards,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'apr',
    index: v3FarmSortBy.apr,
    width: 0.2,
    justify: 'flex-start',
  },
]

export const buildRedirectPath = (currentPath: string, parsedQuery: ParsedQs, status: string) => {
  if (parsedQuery && parsedQuery.farmStatus) {
    return currentPath.replace(`farmStatus=${parsedQuery.farmStatus}`, `farmStatus=${status}`)
  }
  const queryDelimiter = currentPath.includes('?') ? '&' : '?'
  return `${currentPath}${queryDelimiter}farmStatus=${status}`
}

interface Global {
  stableCoins: {
    570: Token[]
  }
  blueChips: {
    570: (Token | undefined)[]
  }
  stablePairs: {
    570: Token[][]
  }
}

const doesItemMatchSearch = (item: GammaPairTokens, search: string) => {
  const getAddress = (token: Token | { token: WrappedTokenInfo }): string => {
    return token instanceof Token ? token.address : token.token.address
  }

  const getSymbol = (token: Token | { token: WrappedTokenInfo }): string => {
    return token instanceof Token ? token.symbol ?? '' : token.token.symbol ?? ''
  }

  return (
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (getSymbol(item.token0).toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (getAddress(item.token0).toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (getSymbol(item.token1).toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (getAddress(item.token1).toLowerCase().includes(search.toLowerCase()) ?? false)
  )
}

const doesItemMatchFilter = (item: GammaPairTokens, farmFilter: string, GlobalData: Global) => {
  const { blueChips, stableCoins, stablePairs } = GlobalData
  const { v3FarmFilter } = GlobalConst.utils

  const getAddress = (token: Token | { token: WrappedTokenInfo }): string => {
    return token instanceof Token ? token.address : token.token.address
  }

  const token0Address = getAddress(item.token0).toLowerCase()
  const token1Address = getAddress(item.token1).toLowerCase()

  const isAddressInList = (address: string, list?: Token[]): boolean => {
    return list?.some((token) => address === token.address.toLowerCase()) ?? false
  }

  const filteredTokens0: Token[] = blueChips[ChainId.ROLLUX].filter((token): token is Token => token !== undefined)

  const blueChipCondition =
    isAddressInList(token0Address, filteredTokens0) && isAddressInList(token1Address, filteredTokens0)
  const stableCoinCondition =
    isAddressInList(token0Address, stableCoins[ChainId.ROLLUX]) &&
    isAddressInList(token1Address, stableCoins[ChainId.ROLLUX])
  const stableLPCondition = stablePairs[ChainId.ROLLUX].some(
    (tokens) => isAddressInList(token0Address, tokens) && isAddressInList(token1Address, tokens)
  )

  switch (farmFilter) {
    case v3FarmFilter.blueChip:
      return blueChipCondition
    case v3FarmFilter.stableCoin:
      return stableCoinCondition
    case v3FarmFilter.stableLP:
      return stableLPCondition
    case v3FarmFilter.otherLP:
      return !blueChipCondition && !stableCoinCondition && !stableLPCondition
    default:
      return true
  }
}

export const gammaRewardTokenAddresses = (gammaRewards: any) =>
  Object.values(GAMMA_MASTERCHEF_ADDRESSES).reduce<string[]>((memo, masterChef) => {
    const gammaReward =
      gammaRewards && masterChef[ChainId.ROLLUX] && gammaRewards[masterChef[ChainId.ROLLUX].toLowerCase()]
        ? gammaRewards[masterChef[ChainId.ROLLUX].toLowerCase()]['pools']
        : undefined
    if (gammaReward) {
      const gammaRewardArr: any[] = Object.values(gammaReward)
      for (const item of gammaRewardArr) {
        if (item && item['rewarders']) {
          const rewarders: any[] = Object.values(item['rewarders'])
          for (const rewarder of rewarders) {
            if (
              rewarder &&
              rewarder['rewardPerSecond'] &&
              Number(rewarder['rewardPerSecond']) > 0 &&
              rewarder.rewardToken &&
              !memo.includes(rewarder.rewardToken)
            ) {
              memo.push(rewarder.rewardToken)
            }
          }
        }
      }
    }
    return memo
  }, [])

export const getStakedAmount = (item: any, stakedAmounts: any) => {
  const masterChefIndex = item.masterChefIndex ?? 0
  const sItem = stakedAmounts?.find(
    (sAmount: any) => sAmount.pid === item.pid && sAmount.masterChefIndex === masterChefIndex
  )
  return sItem ? Number(sItem.amount) : 0
}
const calculateRewardUSD = (gammaReward: any, gammaRewardsWithUSDPrice: any) => {
  return gammaReward?.['rewarders']
    ? Object.values(gammaReward['rewarders']).reduce((total: number, rewarder: any) => {
        const rewardUSD = gammaRewardsWithUSDPrice?.find(
          (item: any) => item.address.toLowerCase() === rewarder.rewardToken.toLowerCase()
        )
        return total + (rewardUSD?.price ?? 0) * rewarder.rewardPerSecond
      }, 0)
    : 0
}

export const sortFarms = (
  farm0: any,
  farm1: any,
  gammaData: any,
  gammaRewards: any,
  sortByGamma: string,
  sortDescGamma: boolean,
  gammaRewardsWithUSDPrice: any
) => {
  // TODO: refactior filter with new function api
  const sortMultiplierGamma = sortDescGamma ? -1 : 1
  const gammaData0 = gammaData ? gammaData[farm0.address.toLowerCase()] : undefined
  const gammaData1 = gammaData ? gammaData[farm1.address.toLowerCase()] : undefined

  const farm0MasterChefAddress = GAMMA_MASTERCHEF_ADDRESSES[ChainId.ROLLUX].toLowerCase()
  const farm1MasterChefAddress = GAMMA_MASTERCHEF_ADDRESSES[ChainId.ROLLUX].toLowerCase()

  const gammaReward0 = gammaRewards?.[farm0MasterChefAddress]?.['pools']?.[farm0.address.toLowerCase()] ?? undefined
  const gammaReward1 = gammaRewards?.[farm1MasterChefAddress]?.['pools']?.[farm1.address.toLowerCase()] ?? undefined

  if (sortByGamma === v3FarmSortBy.pool) {
    const farm0Title = `${farm0.token0?.symbol ?? ''}${farm0.token1?.symbol ?? ''}${farm0.title}`
    const farm1Title = `${farm1.token0?.symbol ?? ''}${farm1.token1?.symbol ?? ''}${farm1.title}`

    return farm0Title > farm1Title ? sortMultiplierGamma : -1 * sortMultiplierGamma
  } else if (sortByGamma === v3FarmSortBy.tvl) {
    const tvl0 = Number(gammaReward0?.['stakedAmountUSD'] ?? 0)
    const tvl1 = Number(gammaReward1?.['stakedAmountUSD'] ?? 0)

    return tvl0 > tvl1 ? sortMultiplierGamma : -1 * sortMultiplierGamma
  } else if (sortByGamma === v3FarmSortBy.rewards) {
    const farm0RewardUSD = calculateRewardUSD(gammaReward0, gammaRewardsWithUSDPrice)
    const farm1RewardUSD = calculateRewardUSD(gammaReward1, gammaRewardsWithUSDPrice)

    return farm0RewardUSD > farm1RewardUSD ? sortMultiplierGamma : -1 * sortMultiplierGamma
  } else if (sortByGamma === v3FarmSortBy.apr) {
    const poolAPR0 = Number(gammaData0?.['returns']?.['allTime']?.['feeApr'] ?? 0)
    const poolAPR1 = Number(gammaData1?.['returns']?.['allTime']?.['feeApr'] ?? 0)
    const farmAPR0 = Number(gammaReward0?.['apr'] ?? 0)
    const farmAPR1 = Number(gammaReward1?.['apr'] ?? 0)

    return poolAPR0 + farmAPR0 > poolAPR1 + farmAPR1 ? sortMultiplierGamma : -1 * sortMultiplierGamma
  }

  return 1
}

const includesIgnoreCase = (str: string, search: string) => str?.toLowerCase().includes(search.toLowerCase())

const findToken = (tokens: any, itemToken: any) => {
  return tokens?.find((token: any) => itemToken && token?.address?.toLowerCase() === itemToken.address?.toLowerCase())
}

export const checkCondition = (item: any, search: string, GlobalData: any, farmFilter: string) => {
  const searchCondition =
    includesIgnoreCase(item.token0?.symbol, search) ||
    includesIgnoreCase(item.token0?.address, search) ||
    includesIgnoreCase(item.token1?.symbol, search) ||
    includesIgnoreCase(item.token1?.address, search) ||
    includesIgnoreCase(item.title, search)

  const blueChipCondition =
    findToken(GlobalData.blueChips[570], item.token0) && findToken(GlobalData.blueChips[570], item.token1)
  const stableCoinCondition =
    findToken(GlobalData.stableCoins[570], item.token0) && findToken(GlobalData.stableCoins[570], item.token1)

  const stablePair0 = GlobalData.stablePairs[570].find((tokens: any) => findToken(tokens, item.token0))
  const stablePair1 = GlobalData.stablePairs[570].find((tokens: any) => findToken(tokens, item.token1))
  const stableLPCondition = findToken(stablePair0, item.token1) || findToken(stablePair1, item.token0)

  const otherLPCondition = !blueChipCondition && !stableCoinCondition && !stableLPCondition
  const { v3FarmFilter } = GlobalConst.utils

  return (
    searchCondition &&
    (farmFilter === v3FarmFilter.blueChip
      ? blueChipCondition
      : farmFilter === v3FarmFilter.stableCoin
      ? stableCoinCondition
      : farmFilter === v3FarmFilter.stableLP
      ? stableLPCondition
      : farmFilter === v3FarmFilter.otherLP
      ? otherLPCondition
      : true)
  )
}

export function useRewardPerSecond() {
  const masterChefContract = useMasterChefContract(undefined, MINICHEF_ABI)
  return useSingleCallResult(masterChefContract, 'rewardPerSecond')
}

export function usePoolInfo(poolId: string) {
  const masterChefContract = useMasterChefContract(undefined, MINICHEF_ABI)
  return useSingleCallResult(masterChefContract, 'poolInfo', [poolId])
}

export function useTotalAllocationPoints() {
  const masterChefContract = useMasterChefContract(undefined, MINICHEF_ABI)
  return useSingleCallResult(masterChefContract, 'totalAllocPoint')
}

export function useRewardTokenAddress() {
  const masterChefContract = useMasterChefContract(undefined, MINICHEF_ABI)
  return useSingleCallResult(masterChefContract, 'REWARD')
}

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return numerator / 1
  }
  return numerator / denominator
}

export const useApr = (poolId: string, poolRewardPerSecInPSYS: BigNumber, tvlPoolUSD: number) => {
  const [stakingAPR, setStakingAPR] = useState<number>(0)

  const poolInfo = usePoolInfo(poolId)
  const totalAllocPoints = useTotalAllocationPoints()
  const { loading: tokenDataLoading, data: tokenData } = useFetchedTokenData([PSYS_ADDRESS])
  const PSYSUSD = useMemo(() => {
    if (!tokenDataLoading && tokenData?.[0]) return tokenData?.[0].priceUSD
    return 1
  }, [tokenData, tokenDataLoading])
  const stakedPSYS = safeDivide(tvlPoolUSD, PSYSUSD)

  useEffect(() => {
    const fetchData = async () => {
      const stakingValue = safeDivide(
        Number(formatUnits(poolRewardPerSecInPSYS?.mul(60 * 60 * 24 * 365), 18)),
        stakedPSYS
      )
      setStakingAPR(stakingValue)
    }

    fetchData()
  }, [PSYSUSD, poolInfo?.result?.allocPoint, poolRewardPerSecInPSYS, stakedPSYS, totalAllocPoints.result, tvlPoolUSD])

  return stakingAPR
}
