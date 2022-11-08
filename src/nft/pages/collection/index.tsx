import { useWeb3React } from '@web3-react/core'
import { PageName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import { NftGraphQlVariant, useNftGraphQlFlag } from 'featureFlags/flags/nftGraphQl'
import { useCollectionQuery } from 'graphql/data/nft/Collection'
import { MobileHoverBag } from 'nft/components/bag/MobileHoverBag'
import { AnimatedBox, Box } from 'nft/components/Box'
import { Activity, ActivitySwitcher, CollectionNfts, CollectionStats, Filters } from 'nft/components/collection'
import { CollectionNftsAndMenuLoading } from 'nft/components/collection/CollectionNfts'
import { Column, Row } from 'nft/components/Flex'
import { useBag, useCollectionFilters, useFiltersExpanded, useIsCollectionLoading, useIsMobile } from 'nft/hooks'
import * as styles from 'nft/pages/collection/index.css'
import { CollectionStatsFetcher } from 'nft/queries'
import { GenieCollection } from 'nft/types'
import { Suspense, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSpring } from 'react-spring'
import styled from 'styled-components/macro'

const FILTER_WIDTH = 332
const BAG_WIDTH = 324

export const CollectionBannerLoading = () => <Box height="full" width="full" className={styles.loadingBanner} />

const CollectionDescriptionSection = styled(Column)`
  ${styles.ScreenBreakpointsPaddings}
`

const CollectionDisplaySection = styled(Row)`
  ${styles.ScreenBreakpointsPaddings}
  align-items: flex-start;
  position: relative;
`

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
  const isNftGraphQl = useNftGraphQlFlag() === NftGraphQlVariant.Enabled
  const { chainId } = useWeb3React()

  const { data: queryCollection, isLoading } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress as string)
  )

  const gqlCollection = useCollectionQuery(contractAddress as string)

  const collectionStats = useMemo(
    () => (isNftGraphQl ? gqlCollection : queryCollection),
    [isNftGraphQl, gqlCollection, queryCollection]
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
      <Trace
        page={PageName.NFT_COLLECTION_PAGE}
        properties={{ collection_address: contractAddress, chain_id: chainId, is_activity_view: isActivityToggled }}
        shouldLogImpression
      >
        <Column width="full">
          {contractAddress ? (
            <>
              {' '}
              <Box width="full" height="276">
                <Box width="full" height="276">
                  {isLoading ? (
                    <CollectionBannerLoading />
                  ) : (
                    <Box
                      as={collectionStats?.bannerImageUrl ? 'img' : 'div'}
                      height="full"
                      width="full"
                      src={
                        collectionStats?.bannerImageUrl
                          ? `${collectionStats.bannerImageUrl}?w=${window.innerWidth}`
                          : undefined
                      }
                      className={isLoading ? styles.loadingBanner : styles.bannerImage}
                      background="none"
                    />
                  )}
                </Box>
              </Box>
              <CollectionDescriptionSection>
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
              </CollectionDescriptionSection>
              <CollectionDisplaySection>
                <Box position="sticky" top="72" width="0">
                  {isFiltersExpanded && <Filters traitsByGroup={collectionStats?.traits ?? {}} />}
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
                          chainId={chainId}
                        />
                      )
                    : contractAddress &&
                      (isLoading || collectionStats !== undefined) && (
                        <Suspense fallback={<CollectionNftsAndMenuLoading />}>
                          <CollectionNfts
                            collectionStats={collectionStats || ({} as GenieCollection)}
                            contractAddress={contractAddress}
                            rarityVerified={collectionStats?.rarityVerified}
                          />
                        </Suspense>
                      )}
                </AnimatedBox>
              </CollectionDisplaySection>
            </>
          ) : (
            // TODO: Put no collection asset page here
            !isLoading && <div className={styles.noCollectionAssets}>No collection assets exist at this address</div>
          )}
        </Column>
      </Trace>
      <MobileHoverBag />
    </>
  )
}

export default Collection
