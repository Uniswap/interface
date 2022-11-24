import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { stringify } from 'qs'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Redirect, useHistory } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import ClassicElasticTab from 'components/ClassicElasticTab'
import Loader from 'components/Loader'
import RewardTokenPrices from 'components/RewardTokenPrices'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Tutorial, { TutorialType } from 'components/Tutorial'
import UpcomingFarms from 'components/UpcomingFarms'
import Vesting from 'components/Vesting'
import ProMMVesting from 'components/Vesting/ProMMVesting'
import YieldPools from 'components/YieldPools'
import ElasticFarmSummary from 'components/YieldPools/ElasticFarmSummary'
import ElasticFarms from 'components/YieldPools/ElasticFarms'
import FarmGuide from 'components/YieldPools/FarmGuide'
import {
  NewText,
  PageWrapper,
  PoolTitleContainer,
  Tab,
  TabContainer,
  TabWrapper,
  TopBar,
  UpcomingPoolsWrapper,
} from 'components/YieldPools/styleds'
import { ZERO_ADDRESS } from 'constants/index'
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import { AppState } from 'state'
import { useBlockNumber } from 'state/application/hooks'
import { FarmUpdater, useElasticFarms } from 'state/farms/elastic/hooks'
import { useFarmsData } from 'state/farms/hooks'
import { isInEnum } from 'utils/string'

const Farm = () => {
  const { isEVM } = useActiveWeb3React()
  const { loading } = useFarmsData()
  const qs = useParsedQueryString<{ type: string; tab: string }>()
  const { type = 'active', tab = VERSION.ELASTIC } = qs
  const farmType = isInEnum(tab, VERSION) ? tab : VERSION.ELASTIC
  const history = useHistory()

  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const renderTabContent = () => {
    switch (type) {
      case 'active':
        return farmType === VERSION.ELASTIC ? <ElasticFarms active /> : <YieldPools loading={loading} active />
      case 'coming':
        return <UpcomingFarms />
      case 'ended':
        return farmType === VERSION.ELASTIC ? (
          <ElasticFarms active={false} />
        ) : (
          <YieldPools loading={loading} active={false} />
        )
      case 'vesting':
        return farmType === VERSION.ELASTIC ? <ProMMVesting /> : <Vesting loading={vestingLoading} />
      default:
        return <YieldPools loading={loading} active />
    }
  }
  const { mixpanelHandler } = useMixpanel()
  useSyncNetworkParamWithStore()

  // Total rewards for Classic pool
  const { data: farmsByFairLaunch } = useFarmsData()

  const below768 = useMedia('(max-width: 768px)')
  const below1500 = useMedia('(max-width: 1500px)')

  const blockNumber = useBlockNumber()

  const { farms: elasticFarms } = useElasticFarms()

  const rewardTokens = useMemo(() => {
    const tokenMap: { [address: string]: Currency } = {}
    const currentTimestamp = Math.floor(Date.now() / 1000)
    Object.values(farmsByFairLaunch)
      .flat()
      .filter(
        item =>
          (item.endTime && item.endTime > currentTimestamp) ||
          (blockNumber && item.endBlock && item.endBlock > blockNumber),
      )
      .forEach(current => {
        current.rewardTokens.forEach(token => {
          if (token && !tokenMap[token.wrapped.address]) tokenMap[token.wrapped.address] = token
        })
      })

    elasticFarms?.forEach(farm => {
      farm.pools.forEach(pool => {
        if (pool.endTime > Date.now() / 1000)
          pool.totalRewards.forEach(reward => {
            tokenMap[reward.currency.isNative ? ZERO_ADDRESS : reward.currency.wrapped.address] = reward.currency
          })
      })
    })

    return Object.values(tokenMap)
  }, [farmsByFairLaunch, blockNumber, elasticFarms])

  const rewardPriceAndTutorial = !!rewardTokens.length && (
    <Flex
      flex={1}
      width={below768 ? 'calc(100vw - 32px)' : below1500 ? 'calc(100vw - 412px)' : '1088px'}
      sx={{ gap: '4px' }}
      alignItems="center"
      justifyContent="flex-end"
    >
      <RewardTokenPrices
        rewardTokens={rewardTokens}
        style={{ display: 'flex', width: '100%', overflow: 'hidden', flex: 1 }}
      />
    </Flex>
  )

  if (!isEVM) return <Redirect to="/" />
  return (
    <>
      <FarmUpdater />
      <PageWrapper gap="24px">
        <TopBar>
          <ClassicElasticTab />

          {!below768 && rewardPriceAndTutorial}
        </TopBar>

        <FarmGuide farmType={farmType} />

        {farmType === VERSION.ELASTIC && <ElasticFarmSummary />}

        {below768 && rewardPriceAndTutorial}

        <div>
          <TabContainer>
            <TabWrapper>
              <Tab
                onClick={() => {
                  if (type && type !== 'active') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED)
                  }
                  const newQs = { ...qs, type: 'active' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={!type || type === 'active'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Active</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>
              <Tab
                onClick={() => {
                  if (type !== 'ended') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ENDING_VIEWED)
                  }
                  const newQs = { ...qs, type: 'ended' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={type === 'ended'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Ended</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>

              <Tab
                onClick={() => {
                  if (type !== 'coming') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_UPCOMING_VIEWED)
                  }
                  const newQs = { ...qs, type: 'coming' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={type === 'coming'}
              >
                <UpcomingPoolsWrapper>
                  <Trans>Upcoming</Trans>
                  {UPCOMING_POOLS.length > 0 && (
                    <NewText>
                      <Trans>New</Trans>
                    </NewText>
                  )}
                </UpcomingPoolsWrapper>
              </Tab>

              <Tab
                onClick={() => {
                  if (type !== 'vesting') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED)
                  }
                  const newQs = { ...qs, type: 'vesting' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={type === 'vesting'}
              >
                <PoolTitleContainer>
                  <Text>
                    <Trans>Vesting</Trans>
                  </Text>
                  {vestingLoading && <Loader style={{ marginLeft: '4px' }} />}
                </PoolTitleContainer>
              </Tab>
            </TabWrapper>

            {farmType === VERSION.CLASSIC && <Tutorial type={TutorialType.CLASSIC_FARMS} />}
            {farmType === VERSION.ELASTIC && <Tutorial type={TutorialType.ELASTIC_FARMS} />}
          </TabContainer>

          {renderTabContent()}
        </div>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default Farm
