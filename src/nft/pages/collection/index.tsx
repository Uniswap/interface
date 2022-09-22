import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionNfts, CollectionStats, Filters } from 'nft/components/collection'
import { Column, Row } from 'nft/components/Flex'
import { useBag, useCollectionFilters, useFiltersExpanded, useIsMobile } from 'nft/hooks'
import * as styles from 'nft/pages/collection/index.css'
import { CollectionStatsFetcher } from 'nft/queries'
import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { useSpring } from 'react-spring/web'

const FILTER_WIDTH = 332
const BAG_WIDTH = 324

const Collection = () => {
  const { contractAddress } = useParams()

  const isMobile = useIsMobile()
  const [isFiltersExpanded] = useFiltersExpanded()
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
          {collectionStats && (
            <Row paddingLeft="32" paddingRight="32">
              <CollectionStats stats={collectionStats} isMobile={isMobile} />
            </Row>
          )}
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
              <CollectionNfts
                collectionStats={collectionStats}
                contractAddress={contractAddress}
                rarityVerified={collectionStats?.rarityVerified}
              />
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
