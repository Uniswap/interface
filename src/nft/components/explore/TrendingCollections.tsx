import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'

import { Box } from '../../components/Box'
import { Column, Row } from '../../components/Flex'
import { headlineMedium } from '../../css/common.css'
import { fetchTrendingCollections } from '../../queries'
import { CollectionTableColumn, TimePeriod, VolumeType } from '../../types'
import CollectionTable from './CollectionTable'
import * as styles from './Explore.css'

const timeOptions: { label: string; value: TimePeriod }[] = [
  { label: '24 hour', value: TimePeriod.OneDay },
  { label: '7 day', value: TimePeriod.SevenDays },
  { label: '30 day', value: TimePeriod.ThirtyDays },
  { label: 'All time', value: TimePeriod.AllTime },
]

const TrendingCollections = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.OneDay)

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
    <Box width="full" className={styles.section}>
      <Column width="full">
        <Row>
          <Box as="h2" className={headlineMedium} marginTop="88">
            Trending Collections
          </Box>
        </Row>
        <Row>
          <Box className={styles.trendingOptions}>
            {timeOptions.map((timeOption) => {
              return (
                <span
                  className={clsx(
                    styles.trendingOption,
                    timeOption.value === timePeriod && styles.trendingOptionActive
                  )}
                  key={timeOption.value}
                  onClick={() => setTimePeriod(timeOption.value)}
                >
                  {timeOption.label}
                </span>
              )
            })}
          </Box>
        </Row>
        <Row paddingBottom="52">{data ? <CollectionTable data={trendingCollections} /> : <p>Loading</p>}</Row>
      </Column>
    </Box>
  )
}

export default TrendingCollections
