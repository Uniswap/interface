import React from 'react'
import { Trans } from '@lingui/macro'

import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useFarmsData } from 'state/farms/hooks'
import { useFarmHistoryModalToggle } from 'state/application/hooks'
import Loader from 'components/Loader'
import {
  TopBar,
  TabContainer,
  TabWrapper,
  Tab,
  PoolTitleContainer,
  UpcomingPoolsWrapper,
  NewText,
  HistoryButton,
  Divider,
} from 'components/YieldPools/styleds'
import Vesting from 'components/Vesting'
import FarmHistoryModal from 'components/FarmHistoryModal'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import YieldPools from 'components/YieldPools'
import RewardTokenPrices from 'components/RewardTokenPrices'
import { Text } from 'rebass'
import UpcomingFarms from 'components/UpcomingFarms'
import History from 'components/Icons/History'
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory } from 'react-router-dom'
import { PageWrapper } from 'pages/CreatePool/styled'

const Farms = () => {
  const { loading, data: farms } = useFarmsData()
  const { tab } = useParsedQueryString()
  const history = useHistory()

  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const renderTabContent = () => {
    switch (tab) {
      case 'active':
        return <YieldPools loading={loading} active />
      case 'coming':
        return <UpcomingFarms />
      case 'ended':
        return <YieldPools loading={loading} active={false} />
      case 'vesting':
        return <Vesting loading={vestingLoading} />
      default:
        return <YieldPools loading={loading} active />
    }
  }

  return (
    <>
      <PageWrapper>
        <TopBar>
          <RewardTokenPrices />
          <HistoryButton onClick={toggleFarmHistoryModal} style={{ marginLeft: '16px' }}>
            <History />
            <Trans>History</Trans>
          </HistoryButton>
        </TopBar>

        <TabContainer>
          <TabWrapper>
            <Tab onClick={() => history.push('/farms?tab=active')} isActive={!tab || tab === 'active'}>
              <PoolTitleContainer>
                <span>
                  <Trans>Active</Trans>
                </span>
                {loading && <Loader style={{ marginLeft: '4px' }} />}
              </PoolTitleContainer>
            </Tab>
            <Tab onClick={() => history.push('/farms?tab=ended')} isActive={tab === 'ended'}>
              <PoolTitleContainer>
                <span>
                  <Trans>Ended</Trans>
                </span>
              </PoolTitleContainer>
            </Tab>

            <Tab onClick={() => history.push('/farms?tab=coming')} isActive={tab === 'coming'}>
              <UpcomingPoolsWrapper>
                <Trans>Upcoming</Trans>
                {UPCOMING_POOLS.length > 0 && (
                  <NewText>
                    <Trans>New</Trans>
                  </NewText>
                )}
              </UpcomingPoolsWrapper>
            </Tab>

            <Divider />

            <Tab onClick={() => history.push('/farms?tab=vesting')} isActive={tab === 'vesting'}>
              <PoolTitleContainer>
                <Text>
                  <Trans>My Vesting</Trans>
                </Text>
                {vestingLoading && <Loader style={{ marginLeft: '4px' }} />}
              </PoolTitleContainer>
            </Tab>
          </TabWrapper>
        </TabContainer>

        {renderTabContent()}
      </PageWrapper>
      <FarmHistoryModal farms={Object.values(farms).flat()} />
      <SwitchLocaleLink />
    </>
  )
}

export default Farms
