import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useMemo } from 'react'
import { Share2 } from 'react-feather'
import { useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import ClassicElasticTab from 'components/ClassicElasticTab'
import Loader from 'components/Loader'
import RewardTokenPrices from 'components/RewardTokenPrices'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Tutorial, { TutorialType } from 'components/Tutorial'
import Vesting from 'components/Vesting'
import ProMMVesting from 'components/Vesting/ProMMVesting'
import YieldPools from 'components/YieldPools'
import ElasticFarms from 'components/YieldPools/ElasticFarms'
import FarmGuide from 'components/YieldPools/FarmGuide'
import { PageWrapper, PoolTitleContainer, Tab, TabContainer, TabWrapper, TopBar } from 'components/YieldPools/styleds'
import { FARM_TAB, ZERO_ADDRESS } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { ApplicationModal } from 'state/application/actions'
import { useBlockNumber, useOpenModal } from 'state/application/hooks'
import { FarmUpdater, useElasticFarms } from 'state/farms/elastic/hooks'
import { useFarmsData } from 'state/farms/hooks'
import { isInEnum } from 'utils/string'

const Farm = () => {
  const { isEVM } = useActiveWeb3React()
  const { loading } = useFarmsData()
  const theme = useTheme()
  const qs = useParsedQueryString<{ type: string; tab: string }>()
  const { type = FARM_TAB.ACTIVE, tab = VERSION.ELASTIC } = qs
  const farmType = isInEnum(tab, VERSION) ? tab : VERSION.ELASTIC
  const navigate = useNavigate()

  const openShareModal = useOpenModal(ApplicationModal.SHARE)

  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const renderTabContent = () => {
    switch (type) {
      case FARM_TAB.ACTIVE:
        return farmType === VERSION.ELASTIC ? <ElasticFarms /> : <YieldPools loading={loading} active />
      case FARM_TAB.ENDED:
        return farmType === VERSION.ELASTIC ? <ElasticFarms /> : <YieldPools loading={loading} active={false} />
      case FARM_TAB.VESTING:
        return farmType === VERSION.ELASTIC ? <ProMMVesting /> : <Vesting loading={vestingLoading} />
      case FARM_TAB.MY_FARMS:
        return farmType === VERSION.ELASTIC ? <ElasticFarms /> : <YieldPools loading={loading} active={false} />

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

  const rewardPrice = !!rewardTokens.length && (
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

  if (!isEVM) return <Navigate to="/" />
  return (
    <>
      <FarmUpdater />
      <PageWrapper gap="24px">
        <div>
          <TopBar>
            <ClassicElasticTab />

            {!below768 && (
              <Flex sx={{ gap: '24px' }}>
                <Tutorial
                  type={farmType === VERSION.ELASTIC ? TutorialType.ELASTIC_FARMS : TutorialType.CLASSIC_FARMS}
                  customIcon={
                    <Flex
                      sx={{ gap: '4px', cursor: 'pointer' }}
                      fontSize="14px"
                      alignItems="center"
                      fontWeight="500"
                      color={theme.subText}
                      role="button"
                    >
                      <TutorialIcon />
                      <Trans>Video Tutorial</Trans>
                    </Flex>
                  }
                />

                <Flex
                  sx={{ gap: '4px', cursor: 'pointer' }}
                  fontSize="14px"
                  alignItems="center"
                  fontWeight="500"
                  color={theme.subText}
                  onClick={() => openShareModal()}
                >
                  <Share2 size={20} />
                  Share
                </Flex>
              </Flex>
            )}
          </TopBar>

          <FarmGuide farmType={farmType} />
        </div>
        {below768 && (
          <Flex alignItems="center" sx={{ gap: '6px' }}>
            {rewardPrice}

            <Flex sx={{ gap: '16px' }} alignItems="center">
              <Tutorial
                type={farmType === VERSION.ELASTIC ? TutorialType.ELASTIC_FARMS : TutorialType.CLASSIC_FARMS}
                customIcon={<TutorialIcon color={theme.subText} style={{ width: '20px', height: '20px' }} />}
              />
              <Share2 color={theme.subText} size={20} onClick={() => openShareModal()} />
            </Flex>
          </Flex>
        )}

        <div>
          <TabContainer>
            <TabWrapper>
              <Tab
                onClick={() => {
                  if (type && type !== 'active') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED)
                  }
                  const newQs = { ...qs, type: 'active' }
                  navigate({
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
                  navigate({
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
                  const newQs = { ...qs, type: FARM_TAB.MY_FARMS }
                  navigate({
                    search: stringify(newQs),
                  })
                }}
                isActive={type === FARM_TAB.MY_FARMS}
              >
                <PoolTitleContainer>
                  <Trans>My Farms</Trans>
                </PoolTitleContainer>
              </Tab>

              <Tab
                onClick={() => {
                  if (type !== 'vesting') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED)
                  }
                  const newQs = { ...qs, type: 'vesting' }
                  navigate({
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

            {!below768 && rewardPrice}
          </TabContainer>

          {renderTabContent()}
        </div>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default Farm
