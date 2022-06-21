import React, { useState, useMemo } from 'react'
import { Trans } from '@lingui/macro'

import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useFarmsData } from 'state/farms/hooks'
import { useFarmHistoryModalToggle, useBlockNumber } from 'state/application/hooks'
import Loader from 'components/Loader'
import {
  TopBar,
  TabContainer,
  TabWrapper,
  Tab,
  PoolTitleContainer,
  UpcomingPoolsWrapper,
  NewText,
  Divider,
  FarmTypeWrapper,
  FarmType,
  PageWrapper,
  ProMMFarmGuide,
  ProMMFarmGuideAndRewardWrapper,
  ProMMTotalRewards,
} from 'components/YieldPools/styleds'
import Vesting from 'components/Vesting'
import FarmHistoryModal from 'components/FarmHistoryModal'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import YieldPools from 'components/YieldPools'
import RewardTokenPrices from 'components/RewardTokenPrices'
import { Text, Flex } from 'rebass'
import UpcomingFarms from 'components/UpcomingFarms'
import History from 'components/Icons/History'
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory } from 'react-router-dom'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import Elastic from 'components/Icons/Elastic'
import Classic from 'components/Icons/Classic'
import { stringify } from 'qs'
import { ExternalLink } from 'theme'
import { ButtonPrimary } from 'components/Button'
import ProMMFarms from 'components/YieldPools/ProMMFarms'
import ProMMVesting from 'components/Vesting/ProMMVesting'
import { useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import HoverDropdown from 'components/HoverDropdown'
import { formattedNum } from 'utils'
import CurrencyLogo from 'components/CurrencyLogo'
import { fixedFormatting } from 'utils/formatBalance'
import { CurrencyAmount, Token, ChainId } from '@kyberswap/ks-sdk-core'
import { HelpCircle } from 'react-feather'
import ElasticTutorialFarmModal from 'components/ElasticTutorialFarmModal'
import { useMedia } from 'react-use'
import { useProMMFarms } from 'state/farms/promm/hooks'
import { useTokens } from 'hooks/Tokens'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { MouseoverTooltip } from 'components/Tooltip'

const Farms = () => {
  const { loading, data: farms } = useFarmsData()
  const qs = useParsedQueryString()
  const tab = qs.tab || 'active'
  const farmType = qs.farmType || VERSION.CLASSIC
  const history = useHistory()
  const { chainId } = useActiveWeb3React()

  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId as ChainId]

  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  // I'm using this pattern to update data from child component to parent because I dont wanna calculate too many things in this component
  const [prommRewards, setPrommRewards] = useState<{
    [fairLaunchAddress: string]: { totalUsdValue: number; amounts: CurrencyAmount<Token>[] }
  }>({})

  const onUpdateUserReward = (address: string, totalUsdValue: number, amounts: CurrencyAmount<Token>[]) => {
    setPrommRewards(prev => {
      prev[address] = { totalUsdValue, amounts }
      return prev
    })
  }

  const prommRewardUsd = Object.values(prommRewards).reduce((acc, cur) => acc + cur.totalUsdValue, 0)
  const prommRewardAmountByAddress: { [address: string]: CurrencyAmount<Token> } = {}
  Object.values(prommRewards).forEach(item => {
    item.amounts.forEach(amount => {
      const address = amount.currency.isNative ? amount.currency.symbol : amount.currency.address
      if (!address) return
      if (!prommRewardAmountByAddress[address]) prommRewardAmountByAddress[address] = amount
      else prommRewardAmountByAddress[address] = prommRewardAmountByAddress[address].add(amount)
    })
  })

  const renderTabContent = () => {
    switch (tab) {
      case 'active':
        return farmType === VERSION.ELASTIC ? (
          <ProMMFarms active onUpdateUserReward={onUpdateUserReward} />
        ) : (
          <YieldPools loading={loading} active />
        )
      case 'coming':
        return <UpcomingFarms />
      case 'ended':
        return farmType === VERSION.ELASTIC ? (
          <ProMMFarms active={false} onUpdateUserReward={onUpdateUserReward} />
        ) : (
          <YieldPools loading={loading} active={false} />
        )
      case 'vesting':
        // TODO: merge 2 vesting pages
        return farmType === VERSION.ELASTIC ? <ProMMVesting /> : <Vesting loading={vestingLoading} />
      default:
        return <YieldPools loading={loading} active />
    }
  }
  const { mixpanelHandler } = useMixpanel()
  const theme = useTheme()

  // Total rewards for Classic pool
  const { data: farmsByFairLaunch } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farmsByFairLaunch).flat())
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  const [showModalTutorial, setShowModalTutorial] = useState(false)

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
    let tokenMap: { [address: string]: Token } = {}
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
          if (!tokenMap[token.wrapped.address]) tokenMap[token.wrapped.address] = token
        })
      })

    Object.values(prommTokenMap).forEach(item => {
      if (!tokenMap[item.wrapped.address]) tokenMap[item.wrapped.address] = item
    })

    return Object.values(tokenMap)
  }, [farmsByFairLaunch, blockNumber, prommTokenMap])

  return (
    <>
      <ElasticTutorialFarmModal isOpen={showModalTutorial} onDismiss={() => setShowModalTutorial(false)} />
      <PageWrapper gap="24px">
        <TopBar>
          <FarmTypeWrapper>
            <MouseoverTooltip text={notSupportedMsg || ''}>
              <FarmType
                isDisable={!!notSupportedMsg}
                active={farmType === VERSION.ELASTIC}
                to={{
                  search: stringify({ ...qs, farmType: !!notSupportedMsg ? '' : VERSION.ELASTIC }),
                }}
              >
                <Text width="max-content">
                  <Trans>Elastic Farms</Trans>
                </Text>
                <Elastic />
              </FarmType>
            </MouseoverTooltip>

            <Text color={theme.subText}>|</Text>

            <FarmType
              active={farmType === VERSION.CLASSIC}
              to={{
                search: stringify({ ...qs, farmType: VERSION.CLASSIC }),
              }}
            >
              <Text width="max-content">
                <Trans>Classic Farms</Trans>
              </Text>
              <Classic size={18} />
            </FarmType>
          </FarmTypeWrapper>

          <Flex
            width={below768 ? 'calc(100vw - 32px)' : below1500 ? 'calc(100vw - 412px)' : '1088px'}
            sx={{ gap: '4px' }}
            alignItems="center"
            justifyContent="space-between"
          >
            <RewardTokenPrices
              rewardTokens={rewardTokens}
              style={{ display: 'flex', width: '100%', overflow: 'hidden', flex: 1 }}
            />
            {below768 && (
              <>
                {farmType === VERSION.CLASSIC && (
                  <ButtonPrimary
                    width="max-content"
                    onClick={toggleFarmHistoryModal}
                    padding="10px 12px"
                    style={{ gap: '4px', fontSize: '14px' }}
                  >
                    <History />
                    <Trans>History</Trans>
                  </ButtonPrimary>
                )}

                {farmType === VERSION.ELASTIC && (
                  <ButtonPrimary
                    width="max-content"
                    onClick={() => setShowModalTutorial(true)}
                    padding="10px 12px"
                    style={{ gap: '4px', fontSize: '14px' }}
                  >
                    <HelpCircle size={16} />
                    <Trans>Tutorial</Trans>
                  </ButtonPrimary>
                )}
              </>
            )}
          </Flex>
        </TopBar>

        <ProMMFarmGuideAndRewardWrapper>
          <ProMMFarmGuide>
            {farmType === VERSION.ELASTIC ? (
              <>
                <Trans>Deposit your liquidity & then stake it to earn even more attractive rewards</Trans>.{' '}
                <ExternalLink href="https://docs.kyberswap.com/guides/how-to-farm">
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              </>
            ) : (
              <>
                <Trans>Deposit your liquidity to earn even more attractive rewards</Trans>.{' '}
                <ExternalLink href="https://docs.kyberswap.com/classic/guides/yield-farming-guide">
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              </>
            )}
          </ProMMFarmGuide>

          {tab !== 'vesting' && (
            <ProMMTotalRewards>
              {farmType === VERSION.ELASTIC ? (
                <HoverDropdown
                  dropdownContent={
                    !Object.values(prommRewardAmountByAddress).filter(rw => rw?.greaterThan(0)).length
                      ? ''
                      : Object.values(prommRewardAmountByAddress).map(reward => {
                          return (
                            <Flex alignItems="center" key={reward.currency.address} paddingY="4px">
                              <CurrencyLogo currency={reward.currency} size="16px" />

                              <Text fontSize="12px" marginLeft="4px">
                                {reward.toSignificant(8)} {reward.currency.symbol}
                              </Text>
                            </Flex>
                          )
                        })
                  }
                  content={
                    <Text>
                      <Trans>My Total Rewards:</Trans> {formattedNum(`${prommRewardUsd || 0}`, true)}
                    </Text>
                  }
                />
              ) : (
                <HoverDropdown
                  dropdownContent={
                    !totalRewards.filter(rw => rw?.amount?.gte(0)).length
                      ? ''
                      : totalRewards.map(reward => {
                          if (!reward || !reward.amount || reward.amount.lte(0)) {
                            return null
                          }

                          return (
                            <Flex alignItems="center" key={reward.token.address} paddingY="4px">
                              <CurrencyLogo currency={reward.token} size="16px" />

                              <Text fontSize="12px" marginLeft="4px">
                                {fixedFormatting(reward.amount, reward.token.decimals)} {reward.token.symbol}
                              </Text>
                            </Flex>
                          )
                        })
                  }
                  content={
                    <Text>
                      <Trans>My Total Rewards:</Trans> {formattedNum(`${totalRewardsUSD || 0}`, true)}
                    </Text>
                  }
                />
              )}
            </ProMMTotalRewards>
          )}
        </ProMMFarmGuideAndRewardWrapper>

        <div>
          <TabContainer>
            <TabWrapper>
              <Tab
                onClick={() => {
                  if (tab && tab !== 'active') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'active' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={!tab || tab === 'active'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Active</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>
              <Tab
                onClick={() => {
                  if (tab !== 'ended') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ENDING_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'ended' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={tab === 'ended'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Ended</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>

              <Tab
                onClick={() => {
                  if (tab !== 'coming') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_UPCOMING_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'coming' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={tab === 'coming'}
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

              <Divider />

              <Tab
                onClick={() => {
                  if (tab !== 'vesting') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'vesting' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={tab === 'vesting'}
              >
                <PoolTitleContainer>
                  <Text>
                    <Trans>My Vesting</Trans>
                  </Text>
                  {vestingLoading && <Loader style={{ marginLeft: '4px' }} />}
                </PoolTitleContainer>
              </Tab>
            </TabWrapper>

            {!below768 && farmType === VERSION.CLASSIC && (
              <ButtonPrimary
                width="max-content"
                onClick={toggleFarmHistoryModal}
                padding="10px 12px"
                style={{ gap: '4px', fontSize: '14px' }}
              >
                <History />
                <Trans>History</Trans>
              </ButtonPrimary>
            )}

            {!below768 && farmType === VERSION.ELASTIC && (
              <ButtonPrimary
                width="max-content"
                onClick={() => setShowModalTutorial(true)}
                padding="10px 12px"
                style={{ gap: '4px', fontSize: '14px' }}
              >
                <HelpCircle size={16} />
                <Trans>Tutorial</Trans>
              </ButtonPrimary>
            )}
          </TabContainer>

          {renderTabContent()}
        </div>
      </PageWrapper>
      <FarmHistoryModal farms={Object.values(farms).flat()} />
      <SwitchLocaleLink />
    </>
  )
}

export default Farms
