import { AnimatedBox, Box } from 'nft/components/Box'
import { Activity, ActivitySwitcher, CollectionNfts, CollectionStats, Filters } from 'nft/components/collection'
import { Column, Row } from 'nft/components/Flex'
import { useBag, useCollectionFilters, useFiltersExpanded, useIsMobile } from 'nft/hooks'
import { CollectionStatsFetcher } from 'nft/queries'
import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSpring } from 'react-spring/web'

import * as styles from './index.css'

const FILTER_WIDTH = 332
const BAG_WIDTH = 324

const Collection = () => {
  const { contractAddress } = useParams()

  const isMobile = useIsMobile()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isActivityToggled = pathname.includes('/activity')
  const setMarketCount = useCollectionFilters((state) => state.setMarketCount)
  const isBagExpanded = useBag((state) => state.bagExpanded)

  const { data: collectionStats, isLoading } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress as string)
  )

  const { gridX, gridWidthOffset } = useSpring({
    gridX: isFiltersExpanded ? FILTER_WIDTH : 0,
    gridWidthOffset: isFiltersExpanded
      ? isBagExpanded
        ? BAG_WIDTH + FILTER_WIDTH
        : FILTER_WIDTH
      : isBagExpanded
      ? BAG_WIDTH
      : 0,
  })

  useEffect(() => {
    const marketCount: Record<string, number> = {}
    collectionStats?.marketplaceCount?.forEach(({ marketplace, count }) => {
      marketCount[marketplace] = count
    })
    setMarketCount(marketCount)
  }, [collectionStats?.marketplaceCount, setMarketCount])

  const toggleActivity = () => {
    isActivityToggled
      ? navigate(`/nfts/collection/${contractAddress}`)
      : navigate(`/nfts/collection/${contractAddress}/activity`)
  }

  return (
    <Column width="full">
      {collectionStats && contractAddress ? (
        <>
          {' '}
          <Box width="full" height="160">
            <Box
              as="img"
              maxHeight="full"
              width="full"
              src={collectionStats?.bannerImageUrl}
              className={`${styles.bannerImage}`}
            />
          </Box>
          <Column paddingX="32">
            {collectionStats && <CollectionStats stats={collectionStats} isMobile={isMobile} />}
            <ActivitySwitcher
              showActivity={isActivityToggled}
              toggleActivity={() => {
                isFiltersExpanded && setFiltersExpanded(false)
                toggleActivity()
              }}
            />
          </Column>
          <Row alignItems="flex-start" position="relative" paddingX="48">
            <Box position="sticky" top="72" width="0">
              {isFiltersExpanded && (
                <Filters
                  traitsByAmount={collectionStats?.numTraitsByAmount ?? []}
                  traits={collectionStats?.traits ?? []}
                />
              )}
            </Box>

            {/* @ts-ignore: https://github.com/microsoft/TypeScript/issues/34933 */}
            <AnimatedBox
              style={{
                transform: gridX.interpolate((x) => `translate(${x as number}px)`),
                width: gridWidthOffset.interpolate((x) => `calc(100% - ${x as number}px)`),
              }}
            >
              {isActivityToggled
                ? contractAddress && (
                    <Activity
                      contractAddress={contractAddress}
                      rarityVerified={collectionStats?.rarityVerified ?? false}
                      collectionName={collectionStats?.name ?? ''}
                    />
                  )
                : contractAddress && (
                    <CollectionNfts
                      contractAddress={contractAddress}
                      collectionStats={collectionStats}
                      rarityVerified={collectionStats?.rarityVerified}
                    />
                  )}
            </AnimatedBox>
          </Row>
        </>
      ) : (
        // TODO: Put no collection asset page here
        !isLoading && <div className={styles.noCollectionAssets}>No collection assets exist at this address</div>
      )}
    </Column>
  )
}

export default Collection
