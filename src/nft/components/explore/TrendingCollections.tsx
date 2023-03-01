import { OpacityHoverState } from 'components/Common'
import { useNftGraphqlEnabled } from 'featureFlags/flags/nftlGraphql'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useTrendingCollections } from 'graphql/data/nft/TrendingCollections'
import ms from 'ms.macro'
import { CollectionTableColumn, Denomination, TimePeriod, VolumeType } from 'nft/types'
import { fetchPrice } from 'nft/utils'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { fetchTrendingCollections } from '../../queries'
import CollectionTable from './CollectionTable'

const timeOptions: { label: string; value: TimePeriod }[] = [
  { label: '1D', value: TimePeriod.OneDay },
  { label: '1W', value: TimePeriod.SevenDays },
  { label: '1M', value: TimePeriod.ThirtyDays },
  { label: 'All', value: TimePeriod.AllTime },
]

const ExploreContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  padding: 0 16px;
`

const StyledHeader = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 36px;
  line-height: 44px;
  font-weight: 500;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    font-size: 20px;
    line-height: 28px;
  }
`

const FiltersRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 36px;
  margin-bottom: 20px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    margin-bottom: 16px;
    margin-top: 16px;
  }
`

const Filter = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  padding: 4px;
`

const Selector = styled.div<{ active: boolean }>`
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ active, theme }) => (active ? theme.backgroundInteractive : 'none')};
  cursor: pointer;

  ${OpacityHoverState}
`

const StyledSelectorText = styled(ThemedText.SubHeader)<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textSecondary)};
`

function convertTimePeriodToHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.OneDay:
      return HistoryDuration.Day
    case TimePeriod.SevenDays:
      return HistoryDuration.Week
    case TimePeriod.ThirtyDays:
      return HistoryDuration.Month
    case TimePeriod.AllTime:
      return HistoryDuration.Max
    default:
      return HistoryDuration.Day
  }
}

const TrendingCollections = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.OneDay)
  const [isEthToggled, setEthToggled] = useState(true)
  const isNftGraphqlEnabled = useNftGraphqlEnabled()

  const { isSuccess, data } = useQuery(
    ['trendingCollections', timePeriod],
    () => {
      return fetchTrendingCollections({ volumeType: 'eth', timePeriod, size: 100 })
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: 5000,
    }
  )

  const { data: gqlData, loading } = useTrendingCollections(100, convertTimePeriodToHistoryDuration(timePeriod))

  const { data: usdPrice } = useQuery(['fetchPrice', {}], () => fetchPrice(), {
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: ms`1m`,
  })

  const trendingCollections = useMemo(() => {
    const gatedData = isNftGraphqlEnabled ? gqlData : data
    const dataLoaded = isNftGraphqlEnabled ? !loading : isSuccess
    if (dataLoaded && gatedData) {
      return gatedData.map((d) => ({
        ...d,
        collection: {
          name: d.name,
          logo: d.imageUrl,
          address: d.address,
          isVerified: d.isVerified,
        },
        volume: {
          value: d.volume,
          change: d.volumeChange,
          type: 'eth' as VolumeType,
        },
        floor: {
          value: d.floor,
          change: d.floorChange,
        },
        owners: {
          value: d.owners,
        },
        sales: d.sales,
        totalSupply: d.totalSupply,
        denomination: isEthToggled ? Denomination.ETH : Denomination.USD,
        usdPrice,
      }))
    } else return [] as CollectionTableColumn[]
  }, [isNftGraphqlEnabled, gqlData, data, loading, isSuccess, isEthToggled, usdPrice])

  return (
    <ExploreContainer>
      <StyledHeader>Trending NFT collections</StyledHeader>
      <FiltersRow>
        <Filter>
          {timeOptions.map((timeOption) => {
            return (
              <Selector
                key={timeOption.value}
                active={timeOption.value === timePeriod}
                onClick={() => setTimePeriod(timeOption.value)}
              >
                <StyledSelectorText lineHeight="20px" active={timeOption.value === timePeriod}>
                  {timeOption.label}
                </StyledSelectorText>
              </Selector>
            )
          })}
        </Filter>
        <Filter onClick={() => setEthToggled(!isEthToggled)}>
          <Selector active={isEthToggled}>
            <StyledSelectorText lineHeight="20px" active={isEthToggled}>
              ETH
            </StyledSelectorText>
          </Selector>
          <Selector active={!isEthToggled}>
            <StyledSelectorText lineHeight="20px" active={!isEthToggled}>
              USD
            </StyledSelectorText>
          </Selector>
        </Filter>
      </FiltersRow>
      <CollectionTable data={trendingCollections} timePeriod={timePeriod} />
    </ExploreContainer>
  )
}

export default TrendingCollections
