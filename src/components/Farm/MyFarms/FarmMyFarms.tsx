import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import LoadingGifLight from 'assets/images/lightLoading.gif'
import LoadingGif from 'assets/images/loading.gif'
import { LoaderGif } from 'components/Icons/LoadingSpinner'
import SubTitleContainer from 'components/SubTitleContainer/SubTitleContainer'
import { formatUnits } from 'ethers/lib/utils'
import { getGammaData, getGammaPositions } from 'graphql/utils/util'
import { useMasterChefContract } from 'hooks/useContract'
import { useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useIsMobile } from 'nft/hooks'
import { useEffect, useMemo, useState } from 'react'
import { Frown } from 'react-feather'
import { useQuery } from 'react-query'
import { Box } from 'rebass'
import { useCombinedActiveList } from 'state/lists/hooks'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { getTokenFromAddress } from 'utils/farmUtils'

import { GammaPairs, GlobalConst, itemFarmToken } from '../constants'
import { GammaFarmCard } from '../GammaFarms/GammaFarmCard'
import { filterFarm, getStakedAmount, sortColumnsGamma, useRewardPerSecond, useRewardTokenAddress } from '../utils'

const NoFarmsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 30px;
  flex-direction: column;
  align-items: center;
`

const MyFarmsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: '100%';
`

export default function FarmingMyFarms({ chainId, search }: { search: string; chainId: number }) {
  const { account } = useWeb3React()
  const { v3FarmSortBy } = GlobalConst.utils
  const masterChefContract = useMasterChefContract()
  const isMobile = useIsMobile()
  const isDarkMode = useIsDarkMode()
  const tokenMap = useCombinedActiveList()
  const [sortByGamma, setSortByGamma] = useState(v3FarmSortBy.pool)
  const [sortDescGamma, setSortDescGamma] = useState(false)
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))

  const rewardPerSecond = useRewardPerSecond()
  const rewardTokenAddress = useRewardTokenAddress()

  const rewardsData = useMemo(() => {
    return { rewardPerSecond, rewardTokenAddress }
  }, [rewardPerSecond, rewardTokenAddress])

  const sortByDesktopItemsGamma = sortColumnsGamma.map((item) => {
    return {
      ...item,
      onClick: () => {
        if (sortByGamma === item.index) {
          setSortDescGamma(!sortDescGamma)
        } else {
          setSortByGamma(item.index)
          setSortDescGamma(false)
        }
      },
    }
  })

  const fetchGammaPositions = async () => {
    const gammaPositions = await getGammaPositions(masterChefContract?.address)
    return gammaPositions
  }

  const fetchGammaData = async () => {
    const gammaData = await getGammaData()
    return gammaData
  }

  const {
    isLoading: gammaFarmsLoading,
    data: gammaData,
    refetch: refetchGammaData,
  } = useQuery({
    queryKey: ['fetchGammaData', chainId],
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
    const interval = setInterval(() => {
      const _currentTime = Math.floor(Date.now() / 1000)
      setCurrentTime(_currentTime)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    refetchGammaData()
    refetchGammaPositions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime])

  const allGammaFarms = useMemo(() => {
    const pairsGroups = GammaPairs[ChainId.ROLLUX]
    if (!pairsGroups) {
      return []
    }
    const allPairs = Object.values(pairsGroups).flat()
    return allPairs.filter((item) => item?.ableToFarm)
  }, [])

  const stakedAmountData = useSingleContractMultipleData(
    masterChefContract,
    'userInfo',
    account ? allGammaFarms.map((pair) => [pair.pid, account]) : []
  )

  const stakedAmounts = stakedAmountData.map((callState, index) => {
    const { loading, result } = callState
    const amount = !loading && result?.length ? formatUnits(result[0], 18) : '0'
    const gPair = allGammaFarms[index]

    return {
      amount,
      pid: gPair?.pid,
      masterChefIndex: index,
    }
  })

  const filteredAndSortedMyGammaFarms = useMemo(() => {
    const allFarms = allGammaFarms.map((item) => {
      const stakedAmount = getStakedAmount(item, stakedAmounts)
      if (stakedAmount > 0) {
        const token0 = getTokenFromAddress(item?.token0Address, tokenMap, [])
        const token1 = getTokenFromAddress(item?.token1Address, tokenMap, [])
        return { ...item, token0: token0 ?? null, token1: token1 ?? null } as itemFarmToken
      }
      return { ...item, token0: null, token1: null } as itemFarmToken
    })

    const allFarmsFiltered = allFarms?.filter((item: itemFarmToken) => filterFarm(item, search))

    return allFarmsFiltered
  }, [allGammaFarms, search, stakedAmounts, tokenMap])

  return (
    <MyFarmsContainer>
      {allGammaFarms.length > 0 && (
        <Box>
          <Box px={2} my={2}>
            <SubTitleContainer text="Displays to show your positions." description="Gamma Farms" />
          </Box>
          {gammaFarmsLoading || gammaPositionsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '30px' }}>
              <LoaderGif gif={isDarkMode ? LoadingGif : LoadingGifLight} size="3.5rem" />
            </div>
          ) : filteredAndSortedMyGammaFarms.length === 0 ? (
            <NoFarmsContainer>
              <Frown size={35} stroke="white" />
              <Box mt={1}>noFarms</Box>
            </NoFarmsContainer>
          ) : (
            chainId &&
            !gammaFarmsLoading &&
            !gammaPositionsLoading && (
              <Box>
                {/* {!isMobile && (
                  <Box px={1.5}>
                    <Box>
                      <SortColumns
                        sortColumns={sortByDesktopItemsGamma}
                        selectedSort={sortByGamma}
                        sortDesc={sortDescGamma}
                      />
                    </Box>
                  </Box>
                )} */}
                <Box pb={2}>
                  {filteredAndSortedMyGammaFarms.map((farm: any) => {
                    const foundData = gammaData
                      ? Object.values(gammaData).find((poolData) => poolData.poolAddress === farm.address.toLowerCase())
                      : undefined
                    const tvl = gammaPositions ? gammaPositions[farm.hypervisor].balanceUSD : 0
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
                </Box>
              </Box>
            )
          )}
        </Box>
      )}
    </MyFarmsContainer>
  )
}
