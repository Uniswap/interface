import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'

import Pagination from 'components/Pagination'
import LocalLoader from 'components/LocalLoader'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import TrendingSoonTokenDetail from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'
import MobileChartModal from 'pages/TrueSight/components/TrendingSoonLayout/MobileChartModal'
import useGetTrendingSoonData, { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightChartCategory, TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'
import { Trans } from '@lingui/macro'
import useGetCoinGeckoChartData from 'pages/TrueSight/hooks/useGetCoinGeckoChartData'
import WarningIcon from 'components/LiveChart/WarningIcon'
import useTheme from 'hooks/useTheme'

const ITEM_PER_PAGE = 10
const MAX_ITEM = 50

const TrendingSoonLayout = ({
  filter,
  setFilter,
}: {
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}) => {
  const [selectedToken, setSelectedToken] = useState<TrueSightTokenData>()
  const [isOpenChartModal, setIsOpenChartModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: trendingSoonData,
    isLoading: isLoadingTrendingSoonTokens,
    error: errorWhenLoadingTrendingSoonData,
  } = useGetTrendingSoonData(filter, currentPage, ITEM_PER_PAGE)
  const maxPage = Math.min(
    Math.ceil((trendingSoonData?.total_number_tokens ?? 1) / ITEM_PER_PAGE),
    MAX_ITEM / ITEM_PER_PAGE,
  )
  const trendingSoonTokens = trendingSoonData?.tokens ?? []

  const above1200 = useMedia('(min-width: 1200px)')
  useEffect(() => {
    if (above1200 && selectedToken === undefined && trendingSoonTokens.length) setSelectedToken(trendingSoonTokens[0])
  }, [above1200, selectedToken, trendingSoonTokens])

  useEffect(() => {
    if (above1200 && trendingSoonTokens.length) setSelectedToken(trendingSoonTokens[0])
  }, [currentPage, above1200, trendingSoonTokens])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const [chartTimeframe, setChartTimeframe] = useState<TrueSightTimeframe>(TrueSightTimeframe.ONE_DAY)
  const [chartCategory, setChartCategory] = useState<TrueSightChartCategory>(TrueSightChartCategory.TRADING_VOLUME)
  const { data: chartData, isLoading: isChartDataLoading } = useGetCoinGeckoChartData(
    selectedToken ? selectedToken.present_on_chains[0] : undefined,
    selectedToken ? selectedToken.platforms[selectedToken.present_on_chains[0]] : undefined,
    chartTimeframe,
  )

  const theme = useTheme()

  return (
    <>
      <TrueSightContainer>
        {isLoadingTrendingSoonTokens ? (
          <LocalLoader />
        ) : errorWhenLoadingTrendingSoonData || trendingSoonTokens.length === 0 ? (
          <Flex
            flexDirection="column"
            height="100%"
            justifyContent="center"
            alignItems="center"
            style={{ height: '616px', gap: '16px' }}
          >
            <WarningIcon />
            <Text color={theme.disableText}>
              <Trans>No token found</Trans>
            </Text>
          </Flex>
        ) : (
          <>
            <Flex minHeight="560px">
              <TrendingSoonTokenList>
                {trendingSoonTokens.map((tokenData, index) => (
                  <TrendingSoonTokenItem
                    key={tokenData.token_id}
                    isSelected={selectedToken?.token_id === tokenData.token_id}
                    tokenIndex={ITEM_PER_PAGE * (currentPage - 1) + index + 1}
                    tokenData={tokenData}
                    onSelect={() =>
                      setSelectedToken(prev =>
                        prev?.token_id === tokenData.token_id && !above1200 ? undefined : tokenData,
                      )
                    }
                    setIsOpenChartModal={setIsOpenChartModal}
                    setFilter={setFilter}
                  />
                ))}
              </TrendingSoonTokenList>
              <TrendingSoonTokenDetailWrapper>
                {selectedToken && (
                  <TrendingSoonTokenDetail
                    tokenData={selectedToken}
                    chartData={chartData}
                    isChartDataLoading={isChartDataLoading}
                    chartCategory={chartCategory}
                    setChartCategory={setChartCategory}
                    chartTimeframe={chartTimeframe}
                    setChartTimeframe={setChartTimeframe}
                    setFilter={setFilter}
                  />
                )}
              </TrendingSoonTokenDetailWrapper>
            </Flex>
            <Pagination
              onPrev={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              onNext={() => setCurrentPage(prev => Math.min(maxPage, prev + 1))}
              currentPage={currentPage}
              maxPage={maxPage}
              style={{ padding: '20px' }}
            />
          </>
        )}
      </TrueSightContainer>
      <MobileChartModal
        isOpen={isOpenChartModal}
        setIsOpen={setIsOpenChartModal}
        chartData={chartData}
        isLoading={isChartDataLoading}
        chartCategory={chartCategory}
        setChartCategory={setChartCategory}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
      />
    </>
  )
}

export const TrueSightContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  min-height: 616px;
`

export const TrendingSoonTokenList = styled.div`
  width: 40%;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  & > *:not(:nth-child(10)) {
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
  `}
`

export const TrendingSoonTokenDetailWrapper = styled.div`
  width: 60%;
  border-left: 1px solid ${({ theme }) => theme.border};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `}
`

export default TrendingSoonLayout
