import clsx from 'clsx'
import { useWindowSize } from 'hooks/useWindowSize'
import { Box } from 'nft/components/Box'
import { Center, Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { bodySmall, buttonMedium, headlineLarge } from 'nft/css/common.css'
import { breakpoints, vars } from 'nft/css/sprinkles.css'
import { ActivityFetcher, fetchTrendingCollections } from 'nft/queries'
import { TimePeriod, TrendingCollection } from 'nft/types'
import { formatEthPrice } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { formatChange, toSignificant } from 'nft/utils/toSignificant'
import { useEffect, useState } from 'react'
import { QueryClient, useQuery } from 'react-query'
import { Link } from 'react-router-dom'

import ActivityFeed from './ActivityFeed'
import * as styles from './Explore.css'

const queryClient = new QueryClient()

const Banner = () => {
  /* Sets initially displayed collection to random number between 0 and 4  */
  const [current, setCurrent] = useState(Math.floor(Math.random() * 5))
  const [hovered, setHover] = useState(false)
  const { width: windowWidth } = useWindowSize()
  const { data: collections } = useQuery(
    ['trendingCollections'],
    () => {
      return fetchTrendingCollections({ volumeType: 'eth', timePeriod: TimePeriod.OneDay, size: 5 })
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  useEffect(() => {
    /* Rotate through Top 5 Collections on 15 second interval */
    let stale = false
    if (hovered || stale) return
    const interval = setInterval(async () => {
      if (collections) {
        const nextCollectionIndex = (current + 1) % collections.length
        const nextCollectionAddress = collections[nextCollectionIndex].address
        setCurrent(nextCollectionIndex)
        await queryClient.prefetchQuery(['collectionActivity', nextCollectionAddress], () =>
          ActivityFetcher(nextCollectionAddress as string)
        )
      }
    }, 15_000)
    return () => {
      stale = true
      clearInterval(interval)
    }
  }, [current, collections, hovered])

  return (
    <Box onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} cursor="pointer" width="full">
      {collections && collections[current] ? (
        <Link to={`/nfts/collection/${collections[current].address}`} style={{ textDecoration: 'none' }}>
          <Box style={{ height: '386px' }}>
            <div
              className={styles.bannerWrap}
              style={{ backgroundImage: `url(${collections[current].bannerImageUrl})` }}
            >
              <Box className={styles.bannerOverlay} width="full" />
              <Box as="section" className={styles.section} display="flex" flexDirection="row" flexWrap="nowrap">
                <CollectionDetails collection={collections[current]} hovered={hovered} rank={current + 1} />
                {windowWidth && windowWidth > breakpoints.lg && <ActivityFeed address={collections[current].address} />}
              </Box>

              <CarouselProgress length={collections.length} currentIndex={current} setCurrent={setCurrent} />
            </div>
          </Box>
        </Link>
      ) : (
        <>
          {/* TODO: Improve Loading State */}
          <p>Loading</p>
        </>
      )}
    </Box>
  )
}

export default Banner

/* Collection Details: displays collection stats within Banner  */
const CollectionDetails = ({
  collection,
  rank,
  hovered,
}: {
  collection: TrendingCollection
  rank: number
  hovered: boolean
}) => (
  <Column className={styles.collectionDetails} paddingTop="40">
    <div className={styles.volumeRank}>#{rank} volume in 24hr</div>
    <Row>
      <Box as="span" marginTop="16" className={clsx(headlineLarge, styles.collectionName)}>
        {collection.name}
      </Box>
      {collection.isVerified && (
        <Box as="span" marginTop="24">
          <VerifiedIcon height="32" width="32" />
        </Box>
      )}
    </Row>
    <Row className={bodySmall} marginTop="12" color="explicitWhite">
      <Box>
        <Box as="span" color="textSecondary" marginRight="4">
          Floor:
        </Box>
        {collection.floor ? formatEthPrice(collection.floor.toString()) : '--'} ETH
      </Box>
      <Box>
        {collection.floorChange ? (
          <Box as="span" color={collection.floorChange > 0 ? 'green200' : 'accentFailure'} marginLeft="4">
            {collection.floorChange > 0 && '+'}
            {formatChange(collection.floorChange)}%
          </Box>
        ) : null}
      </Box>
      <Box marginLeft="24" color="explicitWhite">
        <Box as="span" color="textSecondary" marginRight="4">
          Volume:
        </Box>
        {collection.volume ? putCommas(+toSignificant(collection.volume.toString())) : '--'} ETH
      </Box>
      <Box>
        {collection.volumeChange ? (
          <Box as="span" color={collection.volumeChange > 0 ? 'green200' : 'accentFailure'} marginLeft="4">
            {collection.volumeChange > 0 && '+'}
            {formatChange(collection.volumeChange)}%
          </Box>
        ) : null}
      </Box>
    </Row>
    <Link
      className={clsx(buttonMedium, styles.exploreCollection)}
      to={`/nfts/collection/${collection.address}`}
      style={{ textDecoration: 'none', backgroundColor: `${hovered ? vars.color.blue400 : vars.color.grey700}` }}
    >
      Explore collection
    </Link>
  </Column>
)

/* Carousel Progress indicators */
const CarouselProgress = ({
  length,
  currentIndex,
  setCurrent,
}: {
  length: number
  currentIndex: number
  setCurrent: React.Dispatch<React.SetStateAction<number>>
}) => (
  <Center marginTop="16">
    {Array(length)
      .fill(null)
      .map((value, carouselIndex) => (
        <Box
          cursor="pointer"
          paddingTop="16"
          paddingBottom="16"
          position="relative"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setCurrent(carouselIndex)
          }}
          key={carouselIndex}
        >
          <Box
            as="span"
            className={styles.carouselIndicator}
            display="inline-block"
            backgroundColor={currentIndex === carouselIndex ? 'explicitWhite' : 'accentTextLightTertiary'}
          />
        </Box>
      ))}
  </Center>
)
