import { Token } from '@pollum-io/sdk-core'
import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import LoadingGifLight from 'assets/images/lightLoading.gif'
import LoadingGif from 'assets/images/loading.gif'
import Divider from 'components/Divider/Divider'
import { LoaderGif } from 'components/Icons/LoadingSpinner'
import SubTitleContainer from 'components/SubTitleContainer/SubTitleContainer'
import { GAMMA_MASTERCHEF_ADDRESSES } from 'constants/addresses'
import { formatUnits } from 'ethers/lib/utils'
import { getGammaData, getGammaRewards } from 'graphql/utils/util'
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
import { getTokenFromAddress, useUSDCPricesFromAddresses } from 'utils/farmUtils'

import { GammaPair, GammaPairs, GlobalConst } from '../constants'
import GammaFarmCard from '../GammaFarms/GammaFarmCard'
import SortColumns from '../SortColumn'
import { gammaRewardTokenAddresses, getStakedAmount, sortColumnsGamma, sortFarms } from '../utils'

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

export default function FarmingMyFarms({ chainId }: { search: string; chainId: number }) {
  const { v3FarmSortBy } = GlobalConst.utils
  const { account } = useWeb3React()
  const isMobile = useIsMobile()
  const isDarkMode = useIsDarkMode()
  const tokenMap = useCombinedActiveList()
  const [sortByGamma, setSortByGamma] = useState(v3FarmSortBy.pool)
  const [sortDescGamma, setSortDescGamma] = useState(false)
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))

  const allGammaFarms = useMemo(() => {
    const pairsGroups = GammaPairs[570] || {}
    const allPairs = Object.values(pairsGroups).flat()

    return allPairs.filter((item) => item?.ableToFarm)
  }, [])

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

  const fetchGammaRewards = async () => {
    const gammaRewards = await getGammaRewards()
    return gammaRewards
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
    isLoading: gammaRewardsLoading,
    data: gammaRewards,
    refetch: refetchGammaRewards,
  } = useQuery({
    queryKey: ['fetchGammaRewards', chainId],
    queryFn: fetchGammaRewards,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const _currentTime = Math.floor(Date.now() / 1000)
      setCurrentTime(_currentTime)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    refetchGammaData()
    refetchGammaRewards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime])

  const gammaRewardTokenAddressesFiltered = useMemo(() => {
    return gammaRewardTokenAddresses(gammaRewards)
  }, [gammaRewards])

  const gammaRewardsWithUSDPrice = useUSDCPricesFromAddresses(gammaRewardTokenAddressesFiltered)

  const allGammaPairsToFarm = chainId ? ([] as GammaPair[]).concat(...Object.values(GammaPairs[570])) : []
  const masterChefContract = useMasterChefContract()

  // TODO: check after
  const stakedAmountData = useSingleContractMultipleData(
    masterChefContract,
    'userInfo',
    account
      ? allGammaPairsToFarm.filter((pair) => (pair.masterChefIndex ?? 0) === 0).map((pair) => [pair.pid, account])
      : []
  )

  const stakedAmounts = stakedAmountData.map((callState, index) => {
    const gammaPairsFiltered = allGammaPairsToFarm.filter((pair) => (pair.masterChefIndex ?? 0) === index)
    const { loading, result } = callState
    const amount = !loading && result?.length ? formatUnits(result[0], 18) : '0'
    const gPair = gammaPairsFiltered[index]

    return {
      amount,
      pid: gPair?.pid,
      masterChefIndex: index,
    }
  })

  const myGammaFarms = allGammaPairsToFarm
    .reduce<{ [key: string]: any }>((acc, item) => {
      const stakedAmount = getStakedAmount(item, stakedAmounts)
      if (stakedAmount > 0) {
        const token0 = chainId ? getTokenFromAddress(item.token0Address, chainId, tokenMap, []) : null
        const token1 = chainId ? getTokenFromAddress(item.token1Address, chainId, tokenMap, []) : null
        acc.push({ ...item, stakedAmount, token0, token1 })
      }
      return acc
    }, [])
    .sort((farm0: any, farm1: any) =>
      sortFarms(farm0, farm1, gammaData, gammaRewards, sortByGamma, sortDescGamma, gammaRewardsWithUSDPrice)
    )

  return (
    <MyFarmsContainer>
      {allGammaFarms.length > 0 && (
        <Box>
          <Divider />
          <Box px={2} mt={2}>
            <SubTitleContainer text="Displays to show your positions." description="Gamma Farms" />
          </Box>
          {gammaFarmsLoading || gammaRewardsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '30px' }}>
              <LoaderGif gif={isDarkMode ? LoadingGif : LoadingGifLight} size="3.5rem" />
            </div>
          ) : myGammaFarms.length === 0 ? (
            <NoFarmsContainer>
              <Frown size={35} stroke="white" />
              <Box mt={1}>noFarms</Box>
            </NoFarmsContainer>
          ) : (
            chainId && (
              <Box padding="24px">
                {!isMobile && (
                  <Box px={1.5}>
                    <Box>
                      <SortColumns
                        sortColumns={sortByDesktopItemsGamma}
                        selectedSort={sortByGamma}
                        sortDesc={sortDescGamma}
                      />
                    </Box>
                  </Box>
                )}
                <Box pb={2}>
                  {myGammaFarms.map((farm: Token) => {
                    const gmMasterChef = GAMMA_MASTERCHEF_ADDRESSES[ChainId.ROLLUX].toLowerCase()
                    return (
                      <Box mt={2} key={farm.address}>
                        <GammaFarmCard
                          token0={farm}
                          token1={farm}
                          pairData={farm}
                          data={gammaData ? gammaData[farm.address.toLowerCase()] : undefined}
                          rewardData={
                            gammaRewards?.[gmMasterChef]?.['pools']?.[farm.address.toLowerCase()] ?? undefined
                          }
                        />
                      </Box>
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
