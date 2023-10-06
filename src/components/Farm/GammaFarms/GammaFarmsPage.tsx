import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import LoadingGifLight from 'assets/images/lightLoading.gif'
import LoadingGif from 'assets/images/loading.gif'
import { LoaderGif } from 'components/Icons/LoadingSpinner'
import { getGammaData, getGammaPositions } from 'graphql/utils/util'
import { useMasterChefContract } from 'hooks/useContract'
import React, { useEffect, useMemo, useState } from 'react'
import { Frown } from 'react-feather'
import { useQuery } from 'react-query'
import { useCombinedActiveList } from 'state/lists/hooks'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { getTokenFromAddress } from 'utils/farmUtils'

import { GammaPairs, itemFarmToken } from '../constants'
import { filterFarm, useRewardPerSecond, useRewardTokenAddress } from '../utils'
import { GammaFarmCard } from './GammaFarmCard'

const NoFarmsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 30px;
  flex-direction: column;
  align-items: center;
`

const GammaFarmsPage: React.FC<{
  farmFilter: string
  search: string
  sortBy: string
  sortDesc: boolean
}> = ({ farmFilter, search, sortBy, sortDesc }) => {
  const { chainId } = useWeb3React()
  const tokenMap = useCombinedActiveList()
  const isDarkMode = useIsDarkMode()
  const masterChefContract = useMasterChefContract()

  const rewardPerSecond = useRewardPerSecond()
  const rewardTokenAddress = useRewardTokenAddress()

  const rewardsData = useMemo(() => {
    return { rewardPerSecond, rewardTokenAddress }
  }, [rewardPerSecond, rewardTokenAddress])

  const allGammaFarms = useMemo(() => {
    const pairsGroups = GammaPairs[ChainId.ROLLUX]
    if (!pairsGroups) {
      return []
    }
    const allPairs = Object.values(pairsGroups).flat()
    return allPairs.filter((item) => item?.ableToFarm)
  }, [])

  const fetchGammaData = async () => {
    const gammaData = await getGammaData()
    return gammaData
  }

  const fetchGammaPositions = async () => {
    const gammaPositions = await getGammaPositions(masterChefContract?.address)
    return gammaPositions
  }

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 3000))

  useEffect(() => {
    const interval = setInterval(() => {
      const _currentTime = Math.floor(Date.now() / 3000)
      setCurrentTime(_currentTime)
    }, 3000)
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
    isLoading: gammaPositionsLoading,
    data: gammaPositions,
    refetch: refetchGammaPositions,
  } = useQuery({
    queryKey: ['fetchGammaPositionsFarms'],
    queryFn: fetchGammaPositions,
  })

  useEffect(() => {
    refetchGammaData()
    refetchGammaPositions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime])

  const filteredAndSortedFarms = useMemo(() => {
    if (!chainId) {
      return allGammaFarms.map((item) => ({ ...item, token0: null, token1: null } as itemFarmToken))
    }

    return allGammaFarms
      .map((item) => {
        const token0 = getTokenFromAddress(item?.token0Address, tokenMap, [])
        const token1 = getTokenFromAddress(item?.token1Address, tokenMap, [])
        return { ...item, token0: token0 ?? null, token1: token1 ?? null } as itemFarmToken
      })
      .filter((item) => filterFarm(item, search))
  }, [allGammaFarms, chainId, search, tokenMap])

  return (
    <>
      <div style={{ padding: '2 3' }}>
        {gammaFarmsLoading || gammaPositionsLoading || rewardTokenAddress.loading || rewardPerSecond.loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '30px' }}>
            <LoaderGif gif={isDarkMode ? LoadingGif : LoadingGifLight} size="3.5rem" />
          </div>
        ) : filteredAndSortedFarms.length === 0 ? (
          <NoFarmsContainer>
            <Frown size="2rem" stroke="white" />
            <p style={{ marginTop: 12 }}>noGammaFarms</p>
          </NoFarmsContainer>
        ) : (
          !gammaFarmsLoading &&
          !gammaPositionsLoading &&
          filteredAndSortedFarms.length > 0 && (
            <div>
              {filteredAndSortedFarms.map((farm: any) => {
                const foundData = gammaData
                  ? Object.values(gammaData).find((poolData) => poolData.poolAddress === farm.address.toLowerCase())
                  : undefined

                const tvl = gammaPositions ? gammaPositions[farm.hypervisor]?.balanceUSD : 0

                const rewardData = {
                  tvl,
                  ...rewardsData,
                }

                return (
                  <div style={{ marginBottom: '20px' }} key={farm.address}>
                    {rewardPerSecond && rewardTokenAddress && (
                      <GammaFarmCard
                        token0={farm.token0}
                        token1={farm.token1}
                        pairData={farm}
                        data={foundData}
                        rewardData={rewardData}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </>
  )
}

export default GammaFarmsPage
