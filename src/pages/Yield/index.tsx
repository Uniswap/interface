import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { stringify } from 'qs'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
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
import FarmGuide from 'components/YieldPools/FarmGuide'
import ProMMFarms from 'components/YieldPools/ProMMFarms'
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
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import { VERSION } from 'constants/v2'
import { useTokens } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { AppState } from 'state'
import { useBlockNumber } from 'state/application/hooks'
import { useFarmsData } from 'state/farms/hooks'
import { useProMMFarms } from 'state/farms/promm/hooks'

const Farms = () => {
  const { loading } = useFarmsData()
  const qs = useParsedQueryString()
  const type = qs.type || 'active'
  const farmType = qs.tab || VERSION.ELASTIC
  const history = useHistory()

  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const renderTabContent = () => {
    switch (type) {
      case 'active':
        return farmType === VERSION.ELASTIC ? <ProMMFarms active /> : <YieldPools loading={loading} active />
      case 'coming':
        return <UpcomingFarms />
      case 'ended':
        return farmType === VERSION.ELASTIC ? (
          <ProMMFarms active={false} />
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

  // Total rewards for Classic pool
  const { data: farmsByFairLaunch } = useFarmsData()

  const below768 = useMedia('(max-width: 768px)')
  const below1500 = useMedia('(max-width: 1500px)')

  const blockNumber = useBlockNumber()

  const { data: prommFarms } = useProMMFarms()

  const prommRewardTokenAddress = useMemo(() => {
    return [
      ...new Set(
        Object.values(prommFarms).reduce((acc, cur) => {
          return [...acc, ...cur.map(item => item.rewardTokens).flat()]
        }, [] as string[]),
      ),
    ]
  }, [prommFarms])

  const prommTokenMap = useTokens(prommRewardTokenAddress)

  const rewardTokens = useMemo(() => {
    const tokenMap: { [address: string]: Token } = {}
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

    Object.values(prommTokenMap).forEach(item => {
      if (!tokenMap[item.wrapped.address]) tokenMap[item.wrapped.address] = item
    })

    return Object.values(tokenMap)
  }, [farmsByFairLaunch, blockNumber, prommTokenMap])

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

  return (
    <>
      <PageWrapper gap="24px">
        <TopBar>
          <ClassicElasticTab />

          {!below768 && rewardPriceAndTutorial}
        </TopBar>

        <FarmGuide farmType={farmType as VERSION} />

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

export default Farms
