import React, { useState } from 'react'
import { Trans } from '@lingui/macro'

import { ChainId } from 'libs/sdk/src'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useFarmsData } from 'state/farms/hooks'
import { useActiveWeb3React } from 'hooks'
import { useBlockNumber, useFarmHistoryModalToggle } from 'state/application/hooks'
import { AVERAGE_BLOCK_TIME_IN_SECS } from '../../constants'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import Loader from 'components/Loader'
import HistoryImg from 'assets/svg/history.svg'
import {
  PageWrapper,
  TopBar,
  TabContainer,
  TabWrapper,
  Tab,
  PoolTitleContainer,
  UpcomingPoolsWrapper,
  NewText,
  HistoryButton
} from '../../components/YieldPools/styleds'
import Vesting from 'components/Vesting'
import FarmHistoryModal from 'components/FarmHistoryModal'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import YieldPools from 'components/YieldPools'
import RewardTokenPrices from 'components/RewardTokenPrices'
import UpcomingFarms from 'components/UpcomingFarms'

const Farms = () => {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const { loading, data: farms } = useFarmsData()
  const [activeTab, setActiveTab] = useState(0)
  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const farmsList = Object.values(farms)
    .flat()
    .map(farm => {
      const isFarmStarted = farm && blockNumber && farm.startBlock < blockNumber
      const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber

      let remainingBlocks: number | false | undefined
      let estimatedRemainingSeconds: number | false | undefined
      let formattedEstimatedRemainingTime: string | false | 0 | undefined

      if (!isFarmStarted) {
        remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
        estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
        formattedEstimatedRemainingTime =
          estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
      } else {
        remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
        estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
        formattedEstimatedRemainingTime =
          estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
      }
      return {
        ...farm,
        time: `${isFarmEnded ? 'Ended' : (isFarmStarted ? '' : 'Start in ') + formattedEstimatedRemainingTime}`
      }
    })

  const renderTabContent = () => {
    return activeTab === 0 ? (
      <YieldPools />
    ) : activeTab === 1 ? (
      <Vesting />
    ) : (
      <UpcomingFarms setActiveTab={setActiveTab} />
    )
  }

  return (
    <>
      <PageWrapper>
        <TopBar>
          <RewardTokenPrices />
          <HistoryButton onClick={toggleFarmHistoryModal} style={{ marginLeft: '16px' }}>
            <img src={HistoryImg} alt="HistoryImg" />
            <Trans>History</Trans>
          </HistoryButton>
        </TopBar>

        <TabContainer>
          <TabWrapper>
            <Tab onClick={() => setActiveTab(0)} isActive={activeTab === 0}>
              <PoolTitleContainer>
                <span style={{ marginRight: '4px' }}>
                  <Trans>All Farms</Trans>
                </span>
                {loading && <Loader />}
              </PoolTitleContainer>
            </Tab>
            <Tab onClick={() => setActiveTab(1)} isActive={activeTab === 1}>
              <PoolTitleContainer>
                <span style={{ marginRight: '4px' }}>
                  <Trans>Vesting</Trans>
                </span>
                {vestingLoading && <Loader />}
              </PoolTitleContainer>
            </Tab>
            <Tab onClick={() => setActiveTab(2)} isActive={activeTab === 2}>
              <UpcomingPoolsWrapper>
                <Trans>Upcoming Farms</Trans>
                <NewText>
                  <Trans>New</Trans>
                </NewText>
              </UpcomingPoolsWrapper>
            </Tab>
          </TabWrapper>
        </TabContainer>

        {renderTabContent()}
      </PageWrapper>
      <FarmHistoryModal farms={farmsList} />
      <SwitchLocaleLink />
    </>
  )
}

export default Farms
