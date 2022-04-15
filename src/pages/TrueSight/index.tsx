import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Flex } from 'rebass'

import { TrueSightPageWrapper } from 'pages/TrueSight/styled'
import TrendingSoonHero from 'pages/TrueSight/TrendingSoonHero'
import TrendingHero from 'pages/TrueSight/TrendingHero'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightTab from 'pages/TrueSight/TrueSightTab'
import FilterBar from 'pages/TrueSight/components/FilterBar'
import TrendingSoonLayout from 'pages/TrueSight/components/TrendingSoonLayout'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import TrendingLayout from 'pages/TrueSight/components/TrendingLayout'
import { ChainId } from '@dynamic-amm/sdk'

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

  return (
    <TrueSightPageWrapper>
      <TrueSightTab activeTab={activeTab} />
      {activeTab === TrueSightTabs.TRENDING_SOON && (
        <>
          <TrendingSoonHero />
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
          <TrendingHero />
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
    </TrueSightPageWrapper>
  )
}
