import { MobileHoverBag } from 'nft/components/bag/MobileHoverBag'
import { AnimatedBox, Box } from 'nft/components/Box'
import { Activity, ActivitySwitcher, CollectionNfts, CollectionStats, Filters } from 'nft/components/collection'
import { Column, Row } from 'nft/components/Flex'
import { useBag, useCollectionFilters, useFiltersExpanded, useIsCollectionLoading, useIsMobile } from 'nft/hooks'
import * as styles from 'nft/pages/collection/index.css'
import { CollectionStatsFetcher } from 'nft/queries'
import { GenieCollection } from 'nft/types'
import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSpring } from 'react-spring'

const FILTER_WIDTH = 332
const BAG_WIDTH = 324

const Collection = () => {
  const { contractAddress } = useParams()
  const setIsCollectionStatsLoading = useIsCollectionLoading((state) => state.setIsCollectionStatsLoading)

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

  useEffect(() => {
    setIsCollectionStatsLoading(isLoading)
  }, [isLoading, setIsCollectionStatsLoading])

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
    <>
      <Column width="full">
        {contractAddress ? (
          <>
            {' '}
            <Box width="full" height="160">
              <Box width="full" height="160">
                {isLoading ? (
                  <Box height="full" width="full" className={styles.loadingBanner} />
                ) : (
                  <Box
                    as="img"
                    height="full"
                    width="full"
                    src={collectionStats?.bannerImageUrl}
                    className={isLoading ? styles.loadingBanner : styles.bannerImage}
                    background="none"
                  />
                )}
              </Box>
            </Box>
            <Column paddingX="32">
              {(isLoading || collectionStats !== undefined) && (
                <CollectionStats stats={collectionStats || ({} as GenieCollection)} isMobile={isMobile} />
              )}

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
                  transform: gridX.to((x) => `translate(${x as number}px)`),
                  width: gridWidthOffset.to((x) => `calc(100% - ${x as number}px)`),
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
                  : contractAddress &&
                    (isLoading || collectionStats !== undefined) && (
                      <CollectionNfts
                        collectionStats={collectionStats || ({} as GenieCollection)}
                        contractAddress={contractAddress}
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
      <MobileHoverBag />
    </>
  )
}

export default Collection
