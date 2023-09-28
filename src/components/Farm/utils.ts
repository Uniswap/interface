import { TransactionResponse } from '@ethersproject/abstract-provider'
import { TransactionReceipt } from '@ethersproject/providers'
import { Token } from '@pollum-io/sdk-core'
import { ChainId } from '@pollum-io/smart-order-router'
import { GAMMA_MASTERCHEF_ADDRESSES, PSYS_ADDRESS } from 'constants/addresses'
import { BigNumber, Contract } from 'ethers/lib/ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useFetchedTokenData } from 'graphql/tokens/TokenData'
import { useMasterChefContract } from 'hooks/useContract'
import { atomWithReset } from 'jotai/utils'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { ParsedQs } from 'qs'
import { useEffect, useMemo, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { TransactionType } from 'state/transactions/types'

import { GammaPairTokens, GlobalConst, itemFarmToken, MINICHEF_ABI } from './constants'

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

const gammaRewardTokenAddresses = (gammaRewards: any) =>
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

// export const sortFarms = (
//   farm0: itemFarmToken,
//   farm1: itemFarmToken,
//   gammaData: any,
//   gammaRewards: any,
//   sortByGamma: string,
//   sortDescGamma: boolean
// ) => {
//   console.log('log -----', farm0, farm1, gammaData, sortByGamma, sortDescGamma, gammaRewards)

//   const sortMultiplierGamma = sortDescGamma ? -1 : 1
//   console.log('sortMultiplierGamma', sortMultiplierGamma)
//   // const gammaData0 = gammaData ? gammaData[farm0.address.toLowerCase()] : undefined
//   // const gammaData1 = gammaData ? gammaData[farm1.address.toLowerCase()] : undefined

//   // const farm0MasterChefAddress = GAMMA_MASTERCHEF_ADDRESSES[ChainId.ROLLUX].toLowerCase()
//   // const farm1MasterChefAddress = GAMMA_MASTERCHEF_ADDRESSES[ChainId.ROLLUX].toLowerCase()

//   // const gammaReward0 = gammaRewards?.[farm0MasterChefAddress]?.['pools']?.[farm0.address.toLowerCase()] ?? undefined
//   // const gammaReward1 = gammaRewards?.[farm1MasterChefAddress]?.['pools']?.[farm1.address.toLowerCase()] ?? undefined

//   // if (sortByGamma === v3FarmSortBy.pool) {
//   //   const farm0Title = `${farm0.token0?.symbol ?? ''}${farm0.token1?.symbol ?? ''}${farm0.title}`
//   //   const farm1Title = `${farm1.token0?.symbol ?? ''}${farm1.token1?.symbol ?? ''}${farm1.title}`

//   //   return farm0Title > farm1Title ? sortMultiplierGamma : -1 * sortMultiplierGamma
//   // } else if (sortByGamma === v3FarmSortBy.tvl) {
//   //   const tvl0 = Number(gammaReward0?.['stakedAmountUSD'] ?? 0)
//   //   const tvl1 = Number(gammaReward1?.['stakedAmountUSD'] ?? 0)

//   //   return tvl0 > tvl1 ? sortMultiplierGamma : -1 * sortMultiplierGamma
//   // } else if (sortByGamma === v3FarmSortBy.rewards) {
//   //   const farm0RewardUSD = calculateRewardUSD(gammaReward0, gammaRewardsWithUSDPrice)
//   //   const farm1RewardUSD = calculateRewardUSD(gammaReward1, gammaRewardsWithUSDPrice)

//   //   return farm0RewardUSD > farm1RewardUSD ? sortMultiplierGamma : -1 * sortMultiplierGamma
//   // } else if (sortByGamma === v3FarmSortBy.apr) {
//   //   const poolAPR0 = Number(gammaData0?.['returns']?.['allTime']?.['feeApr'] ?? 0)
//   //   const poolAPR1 = Number(gammaData1?.['returns']?.['allTime']?.['feeApr'] ?? 0)
//   //   const farmAPR0 = Number(gammaReward0?.['apr'] ?? 0)
//   //   const farmAPR1 = Number(gammaReward1?.['apr'] ?? 0)

//   //   return poolAPR0 + farmAPR0 > poolAPR1 + farmAPR1 ? sortMultiplierGamma : -1 * sortMultiplierGamma
//   // }

//   return 1
// }

const includesIgnoreCase = (str: string, search: string) => str?.toLowerCase().includes(search.toLowerCase())

export const filterFarmStringAtom = atomWithReset<string>('')

export const filterFarm = (item: itemFarmToken, search: string): boolean => {
  const token0Symbol = (item.token0 && 'token' in item.token0 ? item.token0.token.symbol : item.token0?.symbol) || ''
  const token0Address = (item.token0 && 'token' in item.token0 ? item.token0.token.address : item.token0?.address) || ''
  const token1Symbol = (item.token1 && 'token' in item.token1 ? item.token1.token.symbol : item.token1?.symbol) || ''
  const token1Address = (item.token1 && 'token' in item.token1 ? item.token1.token.address : item.token1?.address) || ''

  return (
    includesIgnoreCase(token0Symbol, search) ||
    includesIgnoreCase(token0Address, search) ||
    includesIgnoreCase(token1Symbol, search) ||
    includesIgnoreCase(token1Address, search) ||
    includesIgnoreCase(item.title, search)
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

export const getDepositAmounts = async (
  tokenInput: number,
  uniProxyContract: Contract,
  setDeposit1: (deposit: string) => void,
  setDeposit0: (deposit: string) => void,
  pairData: any,
  token0Address: string,
  token1Address: string,
  deposit0: string,
  deposit1: string
) => {
  if (!uniProxyContract) return

  let amounts
  if (tokenInput === 0 && deposit0) {
    amounts = await uniProxyContract.getDepositAmount(pairData.hypervisor, token0Address, parseUnits(deposit0, 18))
    setDeposit1(formatUnits(amounts.amountEnd, 18))
  } else if (tokenInput === 1 && deposit1) {
    amounts = await uniProxyContract.getDepositAmount(pairData.hypervisor, token1Address, parseUnits(deposit1, 18))
    setDeposit0(formatUnits(amounts.amountEnd, 18))
  }
}

// const depositUniProxy = async () => {
//   if (!uniProxyContract || !account) return
//   if (approvalToken0 !== ApprovalState.APPROVED || approvalToken1 !== ApprovalState.APPROVED) {
//     console.error('Tokens not approved')
//     return
//   }

//   try {
//     const response = await uniProxyContract.deposit(
//       parseUnits(deposit0, 18),
//       parseUnits(deposit1, 18),
//       account,
//       pairData.hypervisor,
//       [0, 0, 0, 0]
//     )
//     addTransaction(response, {
//       type: TransactionType.ADD_LIQUIDITY_GAMMA,
//       currencyId0: token0Address,
//       currencyId1: token1Address,
//       amount0: parseUnits(deposit0, 18).toString(),
//       amount1: parseUnits(deposit1, 18).toString(),
//     })
//     const receipt = await response.wait()
//     finalizedTransaction(receipt, {
//       summary: 'depositliquidity',
//     })
//   } catch (e) {
//     console.error('Deposit failed', e)
//   }
// }

export const withdrawHypervisor = async (
  hypervisorContract: Contract | null,
  account: string | undefined,
  unStakeGamma: string,
  pairData: any,
  finalizedTransaction: (
    receipt: TransactionReceipt,
    customData?:
      | {
          summary?: string
          approval?: {
            tokenAddress: string
            spender: string
          }
          claim?: {
            recipient: string
          }
        }
      | undefined
  ) => void,
  addTransaction: (response: TransactionResponse, info: any) => void
) => {
  if (!hypervisorContract || !account) return

  try {
    const response = await hypervisorContract.withdraw(parseUnits(unStakeGamma, 18), account, account, [0, 0, 0, 0])
    addTransaction(response, {
      type: TransactionType.REMOVE_LIQUIDITY_GAMMA,
      amount: parseUnits(unStakeGamma, 18).toString(),
      tokenAddress: pairData.hypervisor,
    })
    const receipt = await response.wait()
    finalizedTransaction(receipt, {
      summary: 'withdrawliquidity',
    })
  } catch (e) {
    console.error('Withdraw failed', e)
  }
}
