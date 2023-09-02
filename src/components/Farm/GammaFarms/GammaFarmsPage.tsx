import { Token } from '@pollum-io/sdk-core'
import { useWeb3React } from '@web3-react/core'
import LoadingGifLight from 'assets/images/lightLoading.gif'
import LoadingGif from 'assets/images/loading.gif'
import { LoaderGif } from 'components/Icons/LoadingSpinner'
import { GAMMA_MASTERCHEF_ADDRESSES } from 'constants/addresses'
// import { useSingleCallResult } from 'state/multicall/v3/hooks';
import { getGammaData, getGammaRewards } from 'graphql/utils/util'
import { useDefaultActiveTokens, useToken } from 'hooks/Tokens'
import { useMasterChefContract } from 'hooks/useContract'
// import {
//   getAllGammaPairs,
//   getGammaData,
//   getGammaRewards,
//   getTokenFromAddress,
// } from 'utils';
// import { useActiveWeb3React } from 'hooks';
// import { useSelectedTokenList } from 'state/lists/hooks';
// import { Token } from '@uniswap/sdk';
// import { GAMMA_MASTERCHEF_ADDRESSES } from 'constants/v3/addresses';
// import { useUSDCPricesFromAddresses } from 'utils/useUSDCPrice';
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSingleCallResult } from 'lib/hooks/multicall'
import React, { useEffect, useMemo, useState } from 'react'
// import { Box } from '@material-ui/core';
import { Frown } from 'react-feather'
import { useQuery } from 'react-query'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import QIGammaMasterChef from '../../../abis/gamma-masterchef1.json'
import { GammaPair, GammaPairs, GlobalConst, GlobalData } from '../constants'
import { doesItemMatchFilter, doesItemMatchSearch, itemGammaToken } from '../utils'
// import { useTranslation } from 'react-i18next';
// import Loader from '../../components/Loader';
// import {
//   GammaPair,
//   GammaPairs,
//   GlobalConst,
//   GlobalData,
// } from 'constants/index';
// import { useQuery } from '@tanstack/react-query';
import GammaFarmCard from './GammaFarmCard'

const GammaFarmsPage: React.FC<{
  farmFilter: string
  search: string
  sortBy: string
  sortDesc: boolean
}> = ({ farmFilter, search, sortBy, sortDesc }) => {
  const { chainId } = useWeb3React()
  const tokenMap = useDefaultActiveTokens()
  const parsedQuery = useParsedQueryString()
  const farmStatus = parsedQuery && parsedQuery.farmStatus ? (parsedQuery.farmStatus as string) : 'active'

  const allGammaFarms = useMemo(() => {
    const pairsGroups = GammaPairs[570] || {}
    const allPairs = Object.values(pairsGroups).flat()

    return allPairs.filter((item) => item?.ableToFarm)
  }, [])

  const allGammaFarmsFiltered = allGammaFarms.filter((item) => !!item.ableToFarm === (farmStatus === 'active'))

  const sortMultiplier = sortDesc ? -1 : 1
  const { v3FarmSortBy } = GlobalConst.utils

  const fetchGammaRewards = async () => {
    const gammaRewards = await getGammaRewards(chainId)
    return gammaRewards
  }

  const fetchGammaData = async () => {
    const gammaData = await getGammaData(chainId)
    return gammaData
  }

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))

  useEffect(() => {
    const interval = setInterval(() => {
      const _currentTime = Math.floor(Date.now() / 1000)
      setCurrentTime(_currentTime)
    }, 300000)
    return () => clearInterval(interval)
  }, [])

  const {
    isLoading: gammaFarmsLoading,
    data: gammaData,
    refetch: refetchGammaData,
  } = useQuery({
    queryKey: ['fetchGammaDataFarms', chainId],
    queryFn: fetchGammaData,
  })

  const {
    isLoading: gammaRewardsLoading,
    data: gammaRewards,
    refetch: refetchGammaRewards,
  } = useQuery({
    queryKey: ['fetchGammaRewardsFarms', chainId],
    queryFn: fetchGammaRewards,
  })

  useEffect(() => {
    refetchGammaData()
    refetchGammaRewards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime])

  // const qiTokenAddress = '0x580a84c73811e1839f75d86d75d88cca0c241ff4'
  // const qiGammaFarm = '0x25B186eEd64ca5FDD1bc33fc4CFfd6d34069BAec'

  const qimasterChefContract = useMasterChefContract(2, undefined, QIGammaMasterChef)
  // const qiHypeContract = useGammaHypervisorContract(qiGammaFarm)

  const qiPoolData = useSingleCallResult(qimasterChefContract, 'poolInfo', [2])
  // const qiGammaStakedAmountData = useSingleCallResult(qiHypeContract, 'balanceOf', [qimasterChefContract?.address])
  // const qiGammaStakedAmount =
  //   !qiGammaStakedAmountData.loading && qiGammaStakedAmountData.result && qiGammaStakedAmountData.result.length > 0
  //     ? Number(formatUnits(qiGammaStakedAmountData.result[0], 18))
  //     : 0
  // const qiGammaData =
  //   gammaData && gammaData[qiGammaFarm.toLowerCase()] ? gammaData[qiGammaFarm.toLowerCase()] : undefined
  // const qiLPTokenUSD =
  //   qiGammaData && qiGammaData.totalSupply && Number(qiGammaData.totalSupply) > 0
  //     ? (Number(qiGammaData.tvlUSD) / Number(qiGammaData.totalSupply)) * 10 ** 18
  //     : 0
  // const qiGammaStakedAmountUSD = qiGammaStakedAmount * qiLPTokenUSD

  const qiAllocPointBN =
    !qiPoolData.loading && qiPoolData.result && qiPoolData.result.length > 0 ? qiPoolData.result.allocPoint : undefined

  // const qiRewardPerSecondData = useSingleCallResult(qimasterChefContract, 'rewardPerSecond', [])

  // const qiRewardPerSecondBN =
  //   !qiRewardPerSecondData.loading && qiRewardPerSecondData.result && qiRewardPerSecondData.result.length > 0
  //     ? qiRewardPerSecondData.result[0]
  //     : undefined

  // const qiTotalAllocPointData = useSingleCallResult(qimasterChefContract, 'totalAllocPoint', [])

  // const qiTotalAllocPointBN =
  //   !qiTotalAllocPointData.loading && qiTotalAllocPointData.result && qiTotalAllocPointData.result.length > 0
  //     ? qiTotalAllocPointData.result[0]
  //     : undefined

  // const qiRewardPerSecond =
  //   qiAllocPointBN && qiRewardPerSecondBN && qiTotalAllocPointBN
  //     ? ((Number(qiAllocPointBN) / Number(qiTotalAllocPointBN)) * Number(qiRewardPerSecondBN)) / 10 ** 18
  //     : undefined

  const gammaRewardTokenAddresses = Object.values(GAMMA_MASTERCHEF_ADDRESSES).reduce<string[]>((memo, masterChef) => {
    const gammaReward =
      gammaRewards && chainId && masterChef[chainId] && gammaRewards[masterChef[chainId].toLowerCase()]
        ? gammaRewards[masterChef[chainId].toLowerCase()]['pools']
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

  // const gammaRewardTokenAddressesWithQI = useMemo(() => {
  //   const containsQI = !!gammaRewardTokenAddresses.find(
  //     (address: string) => address.toLowerCase() === qiTokenAddress.toLowerCase()
  //   )
  //   if (containsQI) {
  //     return gammaRewardTokenAddresses
  //   }
  //   return gammaRewardTokenAddresses.concat([qiTokenAddress])
  // }, [gammaRewardTokenAddresses])

  // const gammaRewardsWithUSDPrice = useUSDCPricesFromAddresses(gammaRewardTokenAddressesWithQI)

  // const qiPrice = gammaRewardsWithUSDPrice?.find(
  //   (item) => item.address.toLowerCase() === qiTokenAddress.toLowerCase()
  // )?.price

  // const qiAPR =
  //   qiRewardPerSecond && qiPrice && qiGammaStakedAmountUSD
  //     ? (qiRewardPerSecond * qiPrice * 3600 * 24 * 365) / qiGammaStakedAmountUSD
  //     : undefined

  // if (chainId && gammaRewards && GAMMA_MASTERCHEF_ADDRESSES[2][chainId] && qiAPR) {
  //   const qiRewardsData = {
  //     apr: qiAPR,
  //     stakedAmount: qiGammaStakedAmount,
  //     stakedAmountUSD: qiGammaStakedAmountUSD,
  //     rewarders: {
  //       rewarder: {
  //         rewardToken: qiTokenAddress,
  //         rewardTokenDecimals: 18,
  //         rewardTokenSymbol: 'QI',
  //         rewardPerSecond: qiRewardPerSecond,
  //         apr: qiAPR,
  //         allocPoint: qiAllocPointBN.toString(),
  //       },
  //     },
  //   }
  //   gammaRewards[GAMMA_MASTERCHEF_ADDRESSES[2][chainId]] = { pools: {} }
  //   gammaRewards[GAMMA_MASTERCHEF_ADDRESSES[2][chainId]]['pools'][qiGammaFarm.toLowerCase()] = qiRewardsData
  // }
  const [tokenMapping, setTokenMapping] = useState<Record<string, Token | null>>({})

  useEffect(() => {
    const uniqueTokenAddresses = [
      ...new Set(
        allGammaFarmsFiltered
          .map((item) => item.token0Address)
          .concat(allGammaFarmsFiltered.map((item) => item.token1Address))
      ),
    ]

    const newTokenMapping: Record<string, Token | null> = {}
    uniqueTokenAddresses.forEach((address) => {
      const token = useToken(address)
      newTokenMapping[address] = token === undefined ? null : token
    })
    setTokenMapping(newTokenMapping)
  }, [allGammaFarmsFiltered])

  const filteredFarms = allGammaFarmsFiltered
    .map((item) => {
      const token0 = tokenMapping[item.token0Address] ?? null
      const token1 = tokenMapping[item.token1Address] ?? null
      return { ...item, token0, token1 } as itemGammaToken
    })
    .filter((item) => doesItemMatchSearch(item, search) && doesItemMatchFilter(item, farmFilter, GlobalData))
    .sort((farm0: itemGammaToken, farm1: itemGammaToken) => {
      const gammaData0 = gammaData ? gammaData[farm0.address.toLowerCase()] : undefined
      const gammaData1 = gammaData ? gammaData[farm1.address.toLowerCase()] : undefined
      const farm0MasterChefAddress =
        chainId && GAMMA_MASTERCHEF_ADDRESSES[farm0.masterChefIndex ?? 0][chainId]
          ? GAMMA_MASTERCHEF_ADDRESSES[farm0.masterChefIndex ?? 0][chainId].toLowerCase()
          : undefined
      const farm1MasterChefAddress =
        chainId && GAMMA_MASTERCHEF_ADDRESSES[farm1.masterChefIndex ?? 0][chainId]
          ? GAMMA_MASTERCHEF_ADDRESSES[farm1.masterChefIndex ?? 0][chainId].toLowerCase()
          : undefined
      const gammaReward0 =
        gammaRewards &&
        farm0MasterChefAddress &&
        gammaRewards[farm0MasterChefAddress] &&
        gammaRewards[farm0MasterChefAddress]['pools']
          ? gammaRewards[farm0MasterChefAddress]['pools'][farm0.address.toLowerCase()]
          : undefined
      const gammaReward1 =
        gammaRewards &&
        farm1MasterChefAddress &&
        gammaRewards[farm1MasterChefAddress] &&
        gammaRewards[farm1MasterChefAddress]['pools']
          ? gammaRewards[farm1MasterChefAddress]['pools'][farm1.address.toLowerCase()]
          : undefined

      if (sortBy === v3FarmSortBy.pool) {
        const farm0Title = (farm0.token0?.symbol ?? '') + (farm0.token1?.symbol ?? '') + farm0.title
        const farm1Title = (farm1.token0?.symbol ?? '') + (farm1.token1?.symbol ?? '') + farm1.title
        return farm0Title > farm1Title ? sortMultiplier : -1 * sortMultiplier
      } else if (sortBy === v3FarmSortBy.tvl) {
        const tvl0 = gammaReward0 && gammaReward0['stakedAmountUSD'] ? Number(gammaReward0['stakedAmountUSD']) : 0
        const tvl1 = gammaReward1 && gammaReward1['stakedAmountUSD'] ? Number(gammaReward1['stakedAmountUSD']) : 0
        return tvl0 > tvl1 ? sortMultiplier : -1 * sortMultiplier
      } else if (sortBy === v3FarmSortBy.rewards) {
        const farm0RewardUSD =
          gammaReward0 && gammaReward0['rewarders']
            ? Object.values(gammaReward0['rewarders']).reduce((total: number, rewarder: any) => {
                const rewardUSD = gammaRewardsWithUSDPrice?.find(
                  (item) => item.address.toLowerCase() === rewarder.rewardToken.toLowerCase()
                )
                return total + (rewardUSD?.price ?? 0) * rewarder.rewardPerSecond
              }, 0)
            : 0

        const farm1RewardUSD =
          gammaReward1 && gammaReward1['rewarders']
            ? Object.values(gammaReward1['rewarders']).reduce((total: number, rewarder: any) => {
                const rewardUSD = gammaRewardsWithUSDPrice?.find(
                  (item) => item.address.toLowerCase() === rewarder.rewardToken.toLowerCase()
                )
                return total + (rewardUSD?.price ?? 0) * rewarder.rewardPerSecond
              }, 0)
            : 0
        return farm0RewardUSD > farm1RewardUSD ? sortMultiplier : -1 * sortMultiplier
      } else if (sortBy === v3FarmSortBy.apr) {
        const poolAPR0 =
          gammaData0 &&
          gammaData0['returns'] &&
          gammaData0['returns']['allTime'] &&
          gammaData0['returns']['allTime']['feeApr']
            ? Number(gammaData0['returns']['allTime']['feeApr'])
            : 0
        const poolAPR1 =
          gammaData1 &&
          gammaData1['returns'] &&
          gammaData1['returns']['allTime'] &&
          gammaData1['returns']['allTime']['feeApr']
            ? Number(gammaData1['returns']['allTime']['feeApr'])
            : 0
        const farmAPR0 = gammaReward0 && gammaReward0['apr'] ? Number(gammaReward0['apr']) : 0
        const farmAPR1 = gammaReward1 && gammaReward1['apr'] ? Number(gammaReward1['apr']) : 0
        return poolAPR0 + farmAPR0 > poolAPR1 + farmAPR1 ? sortMultiplier : -1 * sortMultiplier
      }
      return 1
    })

  // const filteredFarms = allGammaFarmsFiltered
  //   .map((item) => {
  //     if (chainId) {
  //       const token0 = useToken(item.token0Address)
  //       const token1 = useToken(item.token1Address)
  //       return { ...item, token0: token0 ?? null, token1: token1 ?? null }
  //     }
  //     return { ...item, token0: null, token1: null }
  //   })
  //   .filter((item) => {
  //     const searchCondition =
  //       (item.token0 && item.token0.symbol && item.token0.symbol.toLowerCase().includes(search.toLowerCase())) ||
  //       (item.token0 && item.token0.address.toLowerCase().includes(search.toLowerCase())) ||
  //       (item.token1 && item.token1.symbol && item.token1.symbol.toLowerCase().includes(search.toLowerCase())) ||
  //       (item.token1 && item.token1.address.toLowerCase().includes(search.toLowerCase())) ||
  //       item.title.toLowerCase().includes(search.toLowerCase())
  //     const blueChipCondition =
  //       !!GlobalData.blueChips[570].find(
  //         (token) => item.token0 && token?.address.toLowerCase() === item.token0.address.toLowerCase()
  //       ) &&
  //       !!GlobalData.blueChips[570].find(
  //         (token) => item.token1 && token?.address.toLowerCase() === item.token1.address.toLowerCase()
  //       )
  //     const stableCoinCondition =
  //       !!GlobalData.stableCoins[570].find(
  //         (token) => item.token0 && token.address.toLowerCase() === item.token0.address.toLowerCase()
  //       ) &&
  //       !!GlobalData.stableCoins[570].find(
  //         (token) => item.token1 && token.address.toLowerCase() === item.token1.address.toLowerCase()
  //       )

  //     const stablePair0 = GlobalData.stablePairs[570].find(
  //       (tokens) =>
  //         !!tokens.find((token) => item.token0 && token.address.toLowerCase() === item.token0.address.toLowerCase())
  //     )
  //     const stablePair1 = GlobalData.stablePairs[570].find(
  //       (tokens) =>
  //         !!tokens.find((token) => item.token1 && token.address.toLowerCase() === item.token1.address.toLowerCase())
  //     )
  //     const stableLPCondition =
  //       (stablePair0 &&
  //         stablePair0.find(
  //           (token) => item.token1 && token.address.toLowerCase() === item.token1.address.toLowerCase()
  //         )) ||
  //       (stablePair1 &&
  //         stablePair1.find((token) => item.token0 && token.address.toLowerCase() === item.token0.address.toLowerCase()))

  //     return (
  //       searchCondition &&
  //       (farmFilter === v3FarmFilter.blueChip
  //         ? blueChipCondition
  //         : farmFilter === v3FarmFilter.stableCoin
  //         ? stableCoinCondition
  //         : farmFilter === v3FarmFilter.stableLP
  //         ? stableLPCondition
  //         : farmFilter === v3FarmFilter.otherLP
  //         ? !blueChipCondition && !stableCoinCondition && !stableLPCondition
  //         : true)
  //     )
  //   })
  //   .sort((farm0, farm1) => {
  //     const gammaData0 = gammaData ? gammaData[farm0.address.toLowerCase()] : undefined
  //     const gammaData1 = gammaData ? gammaData[farm1.address.toLowerCase()] : undefined
  //     const farm0MasterChefAddress =
  //       chainId && GAMMA_MASTERCHEF_ADDRESSES[farm0.masterChefIndex ?? 0][chainId]
  //         ? GAMMA_MASTERCHEF_ADDRESSES[farm0.masterChefIndex ?? 0][chainId].toLowerCase()
  //         : undefined
  //     const farm1MasterChefAddress =
  //       chainId && GAMMA_MASTERCHEF_ADDRESSES[farm1.masterChefIndex ?? 0][chainId]
  //         ? GAMMA_MASTERCHEF_ADDRESSES[farm1.masterChefIndex ?? 0][chainId].toLowerCase()
  //         : undefined
  //     const gammaReward0 =
  //       gammaRewards &&
  //       farm0MasterChefAddress &&
  //       gammaRewards[farm0MasterChefAddress] &&
  //       gammaRewards[farm0MasterChefAddress]['pools']
  //         ? gammaRewards[farm0MasterChefAddress]['pools'][farm0.address.toLowerCase()]
  //         : undefined
  //     const gammaReward1 =
  //       gammaRewards &&
  //       farm1MasterChefAddress &&
  //       gammaRewards[farm1MasterChefAddress] &&
  //       gammaRewards[farm1MasterChefAddress]['pools']
  //         ? gammaRewards[farm1MasterChefAddress]['pools'][farm1.address.toLowerCase()]
  //         : undefined

  //     if (sortBy === v3FarmSortBy.pool) {
  //       const farm0Title = (farm0.token0?.symbol ?? '') + (farm0.token1?.symbol ?? '') + farm0.title
  //       const farm1Title = (farm1.token0?.symbol ?? '') + (farm1.token1?.symbol ?? '') + farm1.title
  //       return farm0Title > farm1Title ? sortMultiplier : -1 * sortMultiplier
  //     } else if (sortBy === v3FarmSortBy.tvl) {
  //       const tvl0 = gammaReward0 && gammaReward0['stakedAmountUSD'] ? Number(gammaReward0['stakedAmountUSD']) : 0
  //       const tvl1 = gammaReward1 && gammaReward1['stakedAmountUSD'] ? Number(gammaReward1['stakedAmountUSD']) : 0
  //       return tvl0 > tvl1 ? sortMultiplier : -1 * sortMultiplier
  //     } else if (sortBy === v3FarmSortBy.rewards) {
  //       const farm0RewardUSD =
  //         gammaReward0 && gammaReward0['rewarders']
  //           ? Object.values(gammaReward0['rewarders']).reduce((total: number, rewarder: any) => {
  //               const rewardUSD = gammaRewardsWithUSDPrice?.find(
  //                 (item) => item.address.toLowerCase() === rewarder.rewardToken.toLowerCase()
  //               )
  //               return total + (rewardUSD?.price ?? 0) * rewarder.rewardPerSecond
  //             }, 0)
  //           : 0
  //       const farm1RewardUSD =
  //         gammaReward1 && gammaReward1['rewarders']
  //           ? Object.values(gammaReward1['rewarders']).reduce((total: number, rewarder: any) => {
  //               const rewardUSD = gammaRewardsWithUSDPrice?.find(
  //                 (item) => item.address.toLowerCase() === rewarder.rewardToken.toLowerCase()
  //               )
  //               return total + (rewardUSD?.price ?? 0) * rewarder.rewardPerSecond
  //             }, 0)
  //           : 0
  //       return farm0RewardUSD > farm1RewardUSD ? sortMultiplier : -1 * sortMultiplier
  //     } else if (sortBy === v3FarmSortBy.apr) {
  //       const poolAPR0 =
  //         gammaData0 &&
  //         gammaData0['returns'] &&
  //         gammaData0['returns']['allTime'] &&
  //         gammaData0['returns']['allTime']['feeApr']
  //           ? Number(gammaData0['returns']['allTime']['feeApr'])
  //           : 0
  //       const poolAPR1 =
  //         gammaData1 &&
  //         gammaData1['returns'] &&
  //         gammaData1['returns']['allTime'] &&
  //         gammaData1['returns']['allTime']['feeApr']
  //           ? Number(gammaData1['returns']['allTime']['feeApr'])
  //           : 0
  //       const farmAPR0 = gammaReward0 && gammaReward0['apr'] ? Number(gammaReward0['apr']) : 0
  //       const farmAPR1 = gammaReward1 && gammaReward1['apr'] ? Number(gammaReward1['apr']) : 0
  //       return poolAPR0 + farmAPR0 > poolAPR1 + farmAPR1 ? sortMultiplier : -1 * sortMultiplier
  //     }
  //     return 1
  //   })

  const isDarkMode = useIsDarkMode()

  return (
    <div style={{ padding: '2 3' }}>
      {gammaFarmsLoading || gammaRewardsLoading ? (
        <div className="flex justify-center" style={{ padding: '16px 0' }}>
          <LoaderGif gif={isDarkMode ? LoadingGif : LoadingGifLight} size="1.5rem" />
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="flex flex-col items-center" style={{ padding: '16px 0' }}>
          <Frown size="2rem" stroke="white" />
          <p style={{ marginTop: 12 }}>noGammaFarms</p>
        </div>
      ) : !gammaFarmsLoading && filteredFarms.length > 0 && chainId ? (
        <div>
          {filteredFarms.map((farm: GammaPair) => {
            const gfMasterChefAddress = GAMMA_MASTERCHEF_ADDRESSES[farm.masterChefIndex ?? 0][chainId]
              ? GAMMA_MASTERCHEF_ADDRESSES[farm.masterChefIndex ?? 0][chainId].toLowerCase()
              : undefined
            return (
              <div style={{ marginBottom: 2 }} key={farm.address}>
                <GammaFarmCard
                  token0={farm.token0}
                  token1={farm.token1}
                  pairData={farm}
                  data={gammaData ? gammaData[farm.address.toLowerCase()] : undefined}
                  rewardData={
                    gammaRewards &&
                    gfMasterChefAddress &&
                    gammaRewards[gfMasterChefAddress] &&
                    gammaRewards[gfMasterChefAddress]['pools']
                      ? gammaRewards[gfMasterChefAddress]['pools'][farm.address.toLowerCase()]
                      : undefined
                  }
                />
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default GammaFarmsPage
