import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import LoadingGifLight from 'assets/images/lightLoading.gif'
import LoadingGif from 'assets/images/loading.gif'
import { LoaderGif } from 'components/Icons/LoadingSpinner'
import { GAMMA_MASTERCHEF_ADDRESSES } from 'constants/addresses'
// import { useSingleCallResult } from 'state/multicall/v3/hooks';
import { getGammaData, getGammaRewards } from 'graphql/utils/util'
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
import React, { useEffect, useMemo, useState } from 'react'
import { Frown } from 'react-feather'
import { useQuery } from 'react-query'
import { useCombinedActiveList } from 'state/lists/hooks'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { getTokenFromAddress, useUSDCPricesFromAddresses } from 'utils/farmUtils'

import { GammaPairs, GlobalData } from '../constants'
import { checkCondition, sortFarms } from '../utils'
import GammaFarmCard from './GammaFarmCard'

const GammaFarmsPage: React.FC<{
  farmFilter: string
  search: string
  sortBy: string
  sortDesc: boolean
}> = ({ farmFilter, search, sortBy, sortDesc }) => {
  const { chainId } = useWeb3React()
  const tokenMap = useCombinedActiveList()
  const isDarkMode = useIsDarkMode()

  const allGammaFarms = useMemo(() => {
    const pairsGroups = GammaPairs[ChainId.ROLLUX]
    if (!pairsGroups) {
      return []
    }
    const allPairs = Object.values(pairsGroups).flat()
    return allPairs.filter((item) => item?.ableToFarm)
  }, [])

  const fetchGammaRewards = async () => {
    const gammaRewards = await getGammaRewards()
    return gammaRewards
  }

  const fetchGammaData = async () => {
    const gammaData = await getGammaData()
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

  const gammaRewardsWithUSDPrice = useUSDCPricesFromAddresses(gammaRewardTokenAddresses)

  const filteredFarms = allGammaFarms
    .map((item) => {
      if (chainId) {
        const token0 = getTokenFromAddress(item.token0Address, chainId, tokenMap, [])
        const token1 = getTokenFromAddress(item.token1Address, chainId, tokenMap, [])
        return { ...item, token0: token0 ?? null, token1: token1 ?? null }
      }
      return { ...item, token0: null, token1: null }
    })
    .filter((item: any) => checkCondition(item, search, GlobalData, farmFilter))
    .sort((farm0, farm1) =>
      sortFarms(farm0, farm1, gammaData, gammaRewards, sortBy, sortDesc, gammaRewardsWithUSDPrice)
    )

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
          {filteredFarms.map((farm: any) => {
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
