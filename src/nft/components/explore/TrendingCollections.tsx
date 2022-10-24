import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { fetchTrendingCollections } from '../../queries'
import { CollectionTableColumn, TimePeriod, VolumeType } from '../../types'
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
  max-width: 1100px;
`

const FiltersRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 36px;
  margin-bottom: 20px;
`

const Filter = styled.div`
  display: flex;
  outline: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  padding: 4px;
`

const Selector = styled.div<{ active: boolean }>`
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ active, theme }) => (active ? theme.backgroundInteractive : 'none')};
  cursor: pointer;
`

const TrendingCollections = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.OneDay)
  const [isEthToggled, setEthToggled] = useState(true)

  const theme = useTheme()

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

  const trendingCollections = useMemo(() => {
    if (isSuccess && data) {
      return data.map((d) => ({
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
          change: d.ownersChange,
        },
        sales: d.sales,
        totalSupply: d.totalSupply,
      }))
    } else return [] as CollectionTableColumn[]
  }, [data, isSuccess])

  return (
    <ExploreContainer>
      <ThemedText.LargeHeader lineHeight="44px">Trending NFT collections</ThemedText.LargeHeader>
      <FiltersRow>
        <Filter>
          {timeOptions.map((timeOption) => {
            return (
              <Selector
                key={timeOption.value}
                active={timeOption.value === timePeriod}
                onClick={() => setTimePeriod(timeOption.value)}
              >
                <ThemedText.SubHeader
                  lineHeight="20px"
                  color={timeOption.value === timePeriod ? theme.textPrimary : theme.textSecondary}
                >
                  {timeOption.label}
                </ThemedText.SubHeader>
              </Selector>
            )
          })}
        </Filter>
        <Filter onClick={() => setEthToggled(!isEthToggled)}>
          <Selector active={isEthToggled}>
            <ThemedText.SubHeader lineHeight="20px" color={isEthToggled ? theme.textPrimary : theme.textSecondary}>
              ETH
            </ThemedText.SubHeader>
          </Selector>
          <Selector active={!isEthToggled}>
            <ThemedText.SubHeader lineHeight="20px" color={!isEthToggled ? theme.textPrimary : theme.textSecondary}>
              USD
            </ThemedText.SubHeader>
          </Selector>
        </Filter>
      </FiltersRow>
      {data ? <CollectionTable data={trendingCollections} /> : <p>Loading</p>}
    </ExploreContainer>
  )
}

export default TrendingCollections
