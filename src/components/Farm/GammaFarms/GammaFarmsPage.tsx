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

import { GammaPairs, GlobalData } from '../constants'
import { checkCondition, GetRewardPerSecond, GetRewardTokenAddress, sortFarms } from '../utils'
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

  const filteredFarms = allGammaFarms
    .map((item) => {
      if (chainId) {
        const token0 = getTokenFromAddress(item?.token0Address, tokenMap, [])
        const token1 = getTokenFromAddress(item?.token1Address, tokenMap, [])
        return { ...item, token0: token0 ?? null, token1: token1 ?? null }
      }
      return { ...item, token0: null, token1: null }
    })
    .filter((item: any) => checkCondition(item, search, GlobalData, farmFilter))
    .sort((farm0, farm1) => sortFarms(farm0, farm1, gammaData, {}, sortBy, sortDesc, []))
  // TODO: refactor method above to remove gammaRewards

  return (
    <div style={{ padding: '2 3' }}>
      {gammaFarmsLoading || gammaPositionsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '30px' }}>
          <LoaderGif gif={isDarkMode ? LoadingGif : LoadingGifLight} size="3.5rem" />
        </div>
      ) : filteredFarms.length === 0 ? (
        <NoFarmsContainer>
          <Frown size="2rem" stroke="white" />
          <p style={{ marginTop: 12 }}>noGammaFarms</p>
        </NoFarmsContainer>
      ) : (
        !gammaFarmsLoading &&
        filteredFarms.length > 0 && (
          <div>
            {filteredFarms.map((farm: any) => {
              const foundData = gammaData
                ? Object.values(gammaData).find((poolData) => poolData.poolAddress === farm.address.toLowerCase())
                : undefined

              const tvl = gammaPositions ? gammaPositions[farm.hypervisor || allGammaFarms[0].hypervisor].balanceUSD : 0
              const rewardPerSecond = GetRewardPerSecond()
              const rewardTokenAddress = GetRewardTokenAddress()

              const rewardData = {
                tvl,
                rewardPerSecond,
                rewardTokenAddress,
              }

              return (
                <div style={{ marginBottom: '20px' }} key={farm.address}>
                  <GammaFarmCard
                    token0={farm.token0}
                    token1={farm.token1}
                    pairData={farm}
                    data={foundData}
                    rewardData={rewardData}
                  />
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

export default GammaFarmsPage
