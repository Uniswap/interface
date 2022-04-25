import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import { useMedia } from 'react-use'

import {
  TextTooltip,
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarSection,
} from 'pages/TrueSight/styled'
import { TrueSightFilter, TrueSightSortSettings, TrueSightTabs, TrueSightTimeframe } from 'pages/TrueSight/index'
import TimeframePicker from 'pages/TrueSight/components/FilterBar/TimeframePicker'
import TrueSightToggle from 'pages/TrueSight/components/FilterBar/TrueSightToggle'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightSearchBox from 'pages/TrueSight/components/FilterBar/TrueSightSearchBox'
import NetworkSelect from 'pages/TrueSight/components/FilterBar/NetworkSelect'
import useGetTokensForSearchBox from 'pages/TrueSight/hooks/useGetTokensForSearchBox'
import useDebounce from 'hooks/useDebounce'
import useGetTagsForSearchBox from 'pages/TrueSight/hooks/useGetTagsForSearchBox'
import useTheme from 'hooks/useTheme'
import { MouseoverTooltip } from 'components/Tooltip'
import { ButtonEmpty } from 'components/Button'
import { BarChart } from 'react-feather'
import { useTrendingSoonSortingModalToggle } from 'state/application/hooks'
import ModalSorting from 'pages/TrueSight/components/FilterBar/ModalSorting'

interface FilterBarProps {
  activeTab: TrueSightTabs | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
  sortSettings: TrueSightSortSettings
  setSortSettings: React.Dispatch<React.SetStateAction<TrueSightSortSettings>>
}

export default function FilterBar({ activeTab, filter, setFilter, sortSettings, setSortSettings }: FilterBarProps) {
  const isActiveTabTrending = activeTab === TrueSightTabs.TRENDING
  const above1000 = useMedia('(min-width: 1000px)')

  const queryString = useParsedQueryString()

  const setActiveTimeframe = (timeframe: TrueSightTimeframe) => {
    setFilter(prev => ({ ...prev, timeframe }))
  }

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase().trim(), 200)

  const { data: foundTokens } = useGetTokensForSearchBox(
    debouncedSearchText,
    filter.timeframe,
    filter.isShowTrueSightOnly,
  )
  const { data: foundTags } = useGetTagsForSearchBox(debouncedSearchText)

  const theme = useTheme()

  const toggleSortingModal = useTrendingSoonSortingModalToggle()

  const { tab } = useParsedQueryString()
  const tooltipText =
    tab === TrueSightTabs.TRENDING_SOON
      ? t`You can choose to see the tokens with the highest growth potential over the last 24 hours or 7 days`
      : t`You can choose to see currently trending tokens over the last 24 hours or 7 days`

  return above1000 ? (
    <TrueSightFilterBarLayout>
      <TrueSightFilterBarSection style={{ gap: '8px' }}>
        <MouseoverTooltip text={tooltipText}>
          <TextTooltip color={theme.subText} fontSize="14px" fontWeight={500}>
            <Trans>Timeframe</Trans>
          </TextTooltip>
        </MouseoverTooltip>
        <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
      </TrueSightFilterBarSection>
      <TrueSightFilterBarSection style={{ gap: '16px' }}>
        {isActiveTabTrending && (
          <TrueSightToggle
            isActive={filter.isShowTrueSightOnly}
            toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
          />
        )}
        <NetworkSelect filter={filter} setFilter={setFilter} />
        <TrueSightSearchBox
          placeholder={t`Search by token name or tag`}
          minWidth="260px"
          style={{ minWidth: '260px' }}
          foundTags={foundTags}
          foundTokens={foundTokens}
          searchText={searchText}
          setSearchText={setSearchText}
          selectedTag={filter.selectedTag}
          setSelectedTag={tag => setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))}
          selectedTokenData={filter.selectedTokenData}
          setSelectedTokenData={tokenData =>
            setFilter(prev => ({ ...prev, selectedTag: undefined, selectedTokenData: tokenData }))
          }
        />
      </TrueSightFilterBarSection>
    </TrueSightFilterBarLayout>
  ) : (
    <TrueSightFilterBarLayoutMobile>
      <Flex justifyContent="space-between" style={{ gap: '16px' }}>
        {queryString.tab === 'trending' ? (
          <Flex justifyContent="flex-end">
            <TrueSightToggle
              isActive={filter.isShowTrueSightOnly}
              toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
            />
          </Flex>
        ) : (
          <>
            <ButtonEmpty
              style={{ padding: '9px 9px', background: theme.background, width: 'fit-content' }}
              onClick={toggleSortingModal}
            >
              <BarChart
                size={16}
                strokeWidth={3}
                color={theme.subText}
                style={{ transform: 'rotate(90deg) scaleX(-1)' }}
              />
            </ButtonEmpty>
            <ModalSorting sortSettings={sortSettings} setSortSettings={setSortSettings} />
          </>
        )}
        <Flex style={{ gap: '12px', alignItems: 'center' }}>
          <MouseoverTooltip text={tooltipText}>
            <TextTooltip color={theme.subText} fontSize="14px" fontWeight={500}>
              <Trans>Timeframe</Trans>
            </TextTooltip>
          </MouseoverTooltip>
          <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
        </Flex>
      </Flex>
      <Flex style={{ gap: '16px' }}>
        <NetworkSelect filter={filter} setFilter={setFilter} />
        <TrueSightSearchBox
          placeholder={t`Token name or tag`}
          foundTags={foundTags}
          foundTokens={foundTokens}
          searchText={searchText}
          setSearchText={setSearchText}
          selectedTag={filter.selectedTag}
          setSelectedTag={tag => setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))}
          selectedTokenData={filter.selectedTokenData}
          setSelectedTokenData={tokenData =>
            setFilter(prev => ({ ...prev, selectedTag: undefined, selectedTokenData: tokenData }))
          }
          style={{ flex: 1 }}
        />
      </Flex>
    </TrueSightFilterBarLayoutMobile>
  )
}
