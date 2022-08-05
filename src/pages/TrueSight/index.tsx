import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import NotificationIcon from 'components/Icons/NotificationIcon'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import TrendingHero from 'pages/TrueSight/TrendingHero'
import TrendingSoonHero from 'pages/TrueSight/TrendingSoonHero'
import TrueSightTab from 'pages/TrueSight/TrueSightTab'
import FilterBar from 'pages/TrueSight/components/FilterBar'
import TrendingLayout from 'pages/TrueSight/components/TrendingLayout'
import TrendingSoonLayout from 'pages/TrueSight/components/TrendingSoonLayout'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import {
  ButtonText,
  StyledSpinner,
  SubscribeButton,
  TrueSightPageWrapper,
  UnSubscribeButton,
} from 'pages/TrueSight/styled'
import { useTrueSightUnsubscribeModalToggle } from 'state/application/hooks'

import UnsubscribeModal from './components/UnsubscribeModal'
import useNotification from './hooks/useNotification'

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
  const toggleUnsubscribeModal = useTrueSightUnsubscribeModalToggle()

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
  const notificationState = useNotification()
  const { isLoading, isChrome, hasSubscribed, handleSubscribe, handleUnsubscribe } = notificationState

  const upTo992 = useMedia('(max-width: 992px)')

  const handleOnClickUnSubscribe = async () => {
    await handleUnsubscribe()
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
      {hasSubscribed ? (
        <UnSubscribeButton disabled={!isChrome || isLoading} onClick={toggleUnsubscribeModal}>
          {isLoading ? <StyledSpinner color={theme.primary} /> : <NotificationIcon color={theme.primary} />}

          <ButtonText color="primary">
            <Trans>Unsubscribe</Trans>
          </ButtonText>
        </UnSubscribeButton>
      ) : (
        <SubscribeButton isDisabled={!isChrome || isLoading} onClick={handleSubscribe}>
          {isLoading ? <StyledSpinner color={theme.primary} /> : <NotificationIcon />}

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
            {upTo992 && !hasSubscribed && subscribeContent}
          </div>
          <Flex
            flexDirection="column"
            sx={{
              gap: upTo992 ? undefined : '16px',
            }}
          >
            <FilterBar
              activeTab={TrueSightTabs.TRENDING_SOON}
              filter={filter}
              setFilter={setFilter}
              notificationState={notificationState}
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
          <Flex
            flexDirection="column"
            sx={{
              gap: upTo992 ? undefined : '16px',
            }}
          >
            <FilterBar
              activeTab={TrueSightTabs.TRENDING}
              filter={filter}
              setFilter={setFilter}
              notificationState={notificationState}
            />
            <TrendingLayout filter={filter} setFilter={setFilter} />
          </Flex>
        </>
      )}
      <UnsubscribeModal handleUnsubscribe={handleOnClickUnSubscribe} />
    </TrueSightPageWrapper>
  )
}
