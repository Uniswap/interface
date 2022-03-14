import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'

import {
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarSection,
} from 'pages/TrueSight/styled'
import { TrueSightFilter, TrueSightTabs, TrueSightTimeframe } from 'pages/TrueSight/index'
import TimeframePicker from 'pages/TrueSight/components/FilterBar/TimeframePicker'
import TrueSightToggle from 'pages/TrueSight/components/FilterBar/TrueSightToggle'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightSearchBox from 'pages/TrueSight/components/FilterBar/TrueSightSearchBox'
import NetworkSelect from 'pages/TrueSight/components/FilterBar/NetworkSelect'
import useGetTokensForSearchBox from 'pages/TrueSight/hooks/useGetTokensForSearchBox'
import useDebounce from 'hooks/useDebounce'
import useGetTagsFromSearchText from 'pages/TrueSight/hooks/useGetTokensFromSearchText'
import useTheme from 'hooks/useTheme'

interface FilterBarProps {
  activeTab: TrueSightTabs | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

export default function FilterBar({ activeTab, filter, setFilter }: FilterBarProps) {
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
  const { data: foundTags } = useGetTagsFromSearchText(debouncedSearchText)

  const theme = useTheme()

  return above1000 ? (
    <TrueSightFilterBarLayout>
      <TrueSightFilterBarSection style={{ gap: '8px' }}>
        <Text color={theme.subText} fontSize="14px" fontWeight={500}>
          <Trans>Timeframe</Trans>
        </Text>
        <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
      </TrueSightFilterBarSection>
      <TrueSightFilterBarSection style={{ gap: '16px' }}>
        {isActiveTabTrending && (
          <TrueSightToggle
            isActive={filter.isShowTrueSightOnly}
            toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
          />
        )}
        <NetworkSelect />
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
      {queryString.tab === 'trending' && (
        // TODO: Remove style after show NetworkSelect.
        <Flex justifyContent="flex-end" style={{ position: 'absolute', right: 0, top: '8px' }}>
          <TrueSightToggle
            isActive={filter.isShowTrueSightOnly}
            toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
          />
        </Flex>
      )}
      <Flex style={{ gap: '12px', alignItems: 'center' }}>
        <Text color={theme.subText} fontSize="14px" fontWeight={500}>
          <Trans>Timeframe</Trans>
        </Text>
        <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
        <NetworkSelect style={{ flex: 1 }} />
      </Flex>
      <TrueSightSearchBox
        placeholder={t`Search by token name or tag`}
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
    </TrueSightFilterBarLayoutMobile>
  )
}
