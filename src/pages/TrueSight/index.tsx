import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import {
  ButtonText,
  SubscribeButton,
  TrueSightPageWrapper,
  UnSubscribeButton,
  StyledSpinnder,
} from 'pages/TrueSight/styled'
import TrendingSoonHero from 'pages/TrueSight/TrendingSoonHero'
import TrendingHero from 'pages/TrueSight/TrendingHero'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightTab from 'pages/TrueSight/TrueSightTab'
import FilterBar from 'pages/TrueSight/components/FilterBar'
import TrendingSoonLayout from 'pages/TrueSight/components/TrendingSoonLayout'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import TrendingLayout from 'pages/TrueSight/components/TrendingLayout'
import { ChainId } from '@kyberswap/ks-sdk-core'

import { Trans } from '@lingui/macro'
import NotificationIcon from 'components/Icons/NotificationIcon'
import useTheme from 'hooks/useTheme'

import UnsubscribeModal from './components/UnsubscribeModal'
import { useTrueSightUnsubscribeModalToggle } from 'state/application/hooks'
import { useNotification } from './hooks/useNotification'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useMedia } from 'react-use'

export enum TrueSightTabs {
  TRENDING_SOON = 'trending_soon',
  TRENDING = 'trending',
}

export enum TrueSightChartCategory {
  TRADING_VOLUME,
  PRICE,
}

export enum TrueSightTimeframe {
  ONE_DAY = '1D',
  ONE_WEEK = '7D',
}

export interface TrueSightFilter {
  isShowTrueSightOnly: boolean
  timeframe: TrueSightTimeframe
  selectedTag: string | undefined
  selectedTokenData: TrueSightTokenData | undefined
  selectedNetwork: ChainId | undefined
}

export interface TrueSightSortSettings {
  sortBy: 'rank' | 'name' | 'discovered_on'
  sortDirection: 'asc' | 'desc'
}

export default function TrueSight({ history }: RouteComponentProps) {
  const { tab } = useParsedQueryString()
  const [activeTab, setActiveTab] = useState<TrueSightTabs>()
  const [isLoading, setIsLoading] = useState(false)
  const toggleUnsubscribeModal = useTrueSightUnsubscribeModalToggle()
  const { mixpanelHandler } = useMixpanel()

  const [filter, setFilter] = useState<TrueSightFilter>({
    isShowTrueSightOnly: false,
    timeframe: TrueSightTimeframe.ONE_DAY,
    selectedTag: undefined,
    selectedTokenData: undefined,
    selectedNetwork: undefined,
  })
  const [sortSettings, setSortSettings] = useState<TrueSightSortSettings>({ sortBy: 'rank', sortDirection: 'asc' })

  useEffect(() => {
    if (tab === undefined) {
      history.push({ search: '?tab=' + TrueSightTabs.TRENDING_SOON })
    } else {
      setActiveTab(tab as TrueSightTabs)
      setFilter({
        isShowTrueSightOnly: false,
        timeframe: TrueSightTimeframe.ONE_DAY,
        selectedTag: undefined,
        selectedTokenData: undefined,
        selectedNetwork: undefined,
      })
      setSortSettings({ sortBy: 'rank', sortDirection: 'asc' })
    }
  }, [history, tab])

  const theme = useTheme()
  const { isChrome, subscribe, handleSubscribe, handleUnSubscribe } = useNotification()

  const handleOnSubscribe = async () => {
    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON)
    setIsLoading(true)
    await handleSubscribe()
    setIsLoading(false)
  }

  const upTo992 = useMedia('(max-width: 992px)')

  const handleOnUnSubscribe = async () => {
    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_UNSUBSCRIBE_TRENDING_SOON)
    setIsLoading(true)
    await handleUnSubscribe()
    setIsLoading(false)
    toggleUnsubscribeModal()
  }

  const subscribeContent = (
    <Flex
      sx={{ gap: upTo992 ? '8px' : '12px', borderBottom: upTo992 ? `1px solid ${theme.border}` : 0 }}
      alignItems="center"
      justifyContent="space-between"
      paddingY={upTo992 ? '16px' : 0}
    >
      <Text textAlign={upTo992 ? 'start' : 'end'} fontSize="10px">
        <Trans>Tired of missing out on tokens that could be Trending Soon?</Trans>
        <br />
        <Text fontWeight="500">Subscribe now to receive notifications!</Text>
      </Text>
      {subscribe ? (
        <UnSubscribeButton disabled={!isChrome || isLoading} onClick={toggleUnsubscribeModal}>
          {isLoading ? <StyledSpinnder color={theme.primary} /> : <NotificationIcon color={theme.primary} />}

          <ButtonText color="primary">
            <Trans>Unsubscribe</Trans>
          </ButtonText>
        </UnSubscribeButton>
      ) : (
        <SubscribeButton isDisabled={!isChrome || isLoading} onClick={handleOnSubscribe}>
          {isLoading ? <StyledSpinnder color={theme.primary} /> : <NotificationIcon />}

          <ButtonText>
            <Trans>Subscribe</Trans>
          </ButtonText>
        </SubscribeButton>
      )}
    </Flex>
  )

  return (
    <TrueSightPageWrapper>
      <Flex justifyContent="space-between" alignItems="center">
        <TrueSightTab activeTab={activeTab} />

        {!upTo992 && subscribeContent}
      </Flex>
      {activeTab === TrueSightTabs.TRENDING_SOON && (
        <>
          <div>
            <TrendingSoonHero />
            {upTo992 && subscribeContent}
          </div>
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar
              activeTab={TrueSightTabs.TRENDING_SOON}
              filter={filter}
              setFilter={setFilter}
              sortSettings={sortSettings}
              setSortSettings={setSortSettings}
            />
            <TrendingSoonLayout
              filter={filter}
              setFilter={setFilter}
              sortSettings={sortSettings}
              setSortSettings={setSortSettings}
            />
          </Flex>
        </>
      )}
      {activeTab === TrueSightTabs.TRENDING && (
        <>
          <div>
            <TrendingHero />
          </div>
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar
              activeTab={TrueSightTabs.TRENDING}
              filter={filter}
              setFilter={setFilter}
              sortSettings={sortSettings}
              setSortSettings={setSortSettings}
            />
            <TrendingLayout filter={filter} setFilter={setFilter} />
          </Flex>
        </>
      )}
      <UnsubscribeModal handleUnsubscribe={handleOnUnSubscribe} />
    </TrueSightPageWrapper>
  )
}
