import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { Center, Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { bodySmall, buttonMedium, header1, section } from 'nft/css/common.css'
import { fetchTrendingCollections } from 'nft/queries'
import { TimePeriod, TrendingCollection } from 'nft/types'
import { formatEthPrice } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { formatChange, toSignificant } from 'nft/utils/toSignificant'
import { Dispatch, ReactNode, SetStateAction, useEffect, useReducer, useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'

import * as styles from './Explore.css'

const Banner = () => {
  const navigate = useNavigate()
  /* Sets initially displayed collection to random number between 1 and 5  */
  const [current, setCurrent] = useState(Math.floor(Math.random() * 5 + 1))
  const [hovered, toggleHover] = useReducer((state) => !state, false)
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
    const interval = setInterval(async () => {
      if (collections) {
        const nextCollectionIndex = current === collections.length - 1 ? 0 : current + 1
        if (!hovered) setCurrent(nextCollectionIndex)
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [current, collections, hovered])

  return (
    <Box
      className={styles.fullWidth}
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
      cursor="pointer"
      onClick={() => {
        if (collections) navigate(`/nfts/collection/${collections[current].address}`)
      }}
    >
      {collections ? (
        collections.map((collection: TrendingCollection, index: number) => (
          <Box
            visibility={index === current ? 'visible' : 'hidden'}
            key={index}
            style={{
              height: index === current ? '386px' : '0',
              opacity: index === current ? 1 : 0,
              transition: 'visibility 0s linear 0s, opacity 400ms',
            }}
          >
            <CollectionWrapper bannerImageUrl={collection.bannerImageUrl}>
              <div className={styles.bannerContent}>
                <Box
                  as="section"
                  className={section}
                  display="flex"
                  flexDirection="row"
                  flexWrap="nowrap"
                  paddingTop="40"
                >
                  <CollectionDetails collection={collection} hovered={hovered} rank={index + 1} />
                </Box>
                <CarouselProgress length={collections.length} currentIndex={index} setCurrent={setCurrent} />
              </div>
            </CollectionWrapper>
          </Box>
        ))
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

/* Collection Wrapper: applies background image to entire banner */
const CollectionWrapper = ({ bannerImageUrl, children }: { bannerImageUrl: string; children: ReactNode }) => (
  <div className={styles.bannerWrap} style={{ backgroundImage: `url(${bannerImageUrl})` }}>
    <Box className={styles.bannerOverlay} width="full" />
    {children}
  </div>
)

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
  <Column className={styles.collectionDetails} paddingTop="16">
    <div>
      <span className={styles.volumeRank}>#{rank} volume in 24hr</span>
    </div>
    <Row>
      <Box as="span" marginTop="16" className={clsx(header1, styles.collectionName)}>
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
        <Box as="span" color="darkGray" marginRight="4">
          Floor:
        </Box>
        {collection.floor ? formatEthPrice(collection.floor.toString()) : '--'} ETH
      </Box>
      <Box>
        {collection.floorChange ? (
          <Box as="span" color={collection.floorChange > 0 ? 'green200' : 'error'} marginLeft="4">
            {collection.floorChange > 0 && '+'}
            {formatChange(collection.floorChange)}%
          </Box>
        ) : null}
      </Box>
      <Box marginLeft="24" color="explicitWhite">
        <Box as="span" color="darkGray" marginRight="4">
          Volume:
        </Box>
        {collection.volume ? putCommas(+toSignificant(collection.volume.toString())) : '--'} ETH
      </Box>
      <Box>
        {collection.volumeChange ? (
          <Box as="span" color={collection.volumeChange > 0 ? 'green200' : 'error'} marginLeft="4">
            {collection.volumeChange > 0 && '+'}
            {formatChange(collection.volumeChange)}%
          </Box>
        ) : null}
      </Box>
    </Row>
    <Box
      as="a"
      className={clsx(buttonMedium, styles.exploreCollection)}
      backgroundColor={hovered ? 'blue400' : 'grey700'}
      href={`#/nfts/collection/${collection.address}`}
      style={{ textDecoration: 'none' }}
    >
      Explore collection
    </Box>
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
  setCurrent: Dispatch<SetStateAction<number>>
}) => (
  <Center marginTop="16">
    {Array(length)
      .fill(null)
      .map((value, carouselIndex) => (
        <Box
          cursor="pointer"
          paddingTop="16"
          paddingBottom="16"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setCurrent(carouselIndex)
          }}
          key={carouselIndex}
        >
          <Box
            as="span"
            display="inline-block"
            className={clsx(styles.carouselIndicator, carouselIndex === currentIndex && styles.carouselIndicatorActive)}
          />
        </Box>
      ))}
  </Center>
)
