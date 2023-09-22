import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import Column from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { useCollection } from 'graphql/data/nft/Collection'
import { useScreenSize } from 'hooks/useScreenSize'
import { BAG_WIDTH, XXXL_BAG_WIDTH } from 'nft/components/bag/Bag'
import { MobileHoverBag } from 'nft/components/bag/MobileHoverBag'
import { Activity, ActivitySwitcher, CollectionNfts, CollectionStats, Filters } from 'nft/components/collection'
import { CollectionNftsAndMenuLoading } from 'nft/components/collection/CollectionNfts'
import { CollectionPageSkeleton } from 'nft/components/collection/CollectionPageSkeleton'
import { BagCloseIcon } from 'nft/components/icons'
import { useBag, useCollectionFilters, useFiltersExpanded, useIsMobile } from 'nft/hooks'
import * as styles from 'nft/pages/collection/index.css'
import { blocklistedCollections } from 'nft/utils'
import { Suspense, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { animated, easings, useSpring } from 'react-spring'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { TRANSITION_DURATIONS } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'

const FILTER_WIDTH = 332
const EMPTY_TRAIT_OBJ = {}

export const CollectionBannerLoading = styled(LoadingBubble)`
  width: 100%;
  height: 100%;
  border-radius: 0px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    border-radius: 16px;
  }
`

const CollectionContainer = styled(Column)`
  width: 100%;
  align-self: start;
  will-change: width;
`

const AnimatedCollectionContainer = animated(CollectionContainer)

const CollectionAssetsContainer = styled.div<{ hideUnderneath: boolean }>`
  position: ${({ hideUnderneath }) => (hideUnderneath ? 'fixed' : 'static')};
`

const AnimatedCollectionAssetsContainer = animated(CollectionAssetsContainer)

export const BannerWrapper = styled.div`
  height: 100px;
  max-width: 100%;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    margin-top: 16px;
    margin-left: 20px;
    margin-right: 20px;
    height: 288px;
  }
`

const Banner = styled.div<{ src: string }>`
  height: 100%;
  width: 100%;
  background-image: url(${({ src }) => src});
  background-position-y: center;
  background-size: cover;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    border-radius: 16px;
  }
`

const CollectionDescriptionSection = styled(Column)`
  ${styles.ScreenBreakpointsPaddings}
`

const FiltersContainer = styled.div<{ isMobile: boolean; isFiltersExpanded: boolean }>`
  position: ${({ isMobile }) => (isMobile ? 'fixed' : 'sticky')};
  top: 0px;
  left: 0px;
  width: ${({ isMobile }) => (isMobile ? '100%' : '0px')};
  height: ${({ isMobile, isFiltersExpanded }) => (isMobile && isFiltersExpanded ? '100%' : undefined)};
  background: ${({ theme, isMobile }) => (isMobile ? theme.surface2 : undefined)};
  z-index: ${Z_INDEX.modalBackdrop - 3};
  overflow-y: ${({ isMobile }) => (isMobile ? 'scroll' : undefined)};

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    top: 72px;
  }
`

const MobileFilterHeader = styled(Row)`
  padding: 20px 16px;
  justify-content: space-between;
`

// Sticky navbar on light mode looks incorrect because the box shadows from assets overlap the the edges of the navbar.
// As a result it needs 16px padding on either side. These paddings are offset by 16px to account for this. Please see CollectionNFTs.css.ts for the additional sizing context.
// See breakpoint values in ScreenBreakpointsPaddings above - they must match
const CollectionDisplaySection = styled(Row)`
  align-items: flex-start;
  position: relative;
`

const IconWrapper = styled.button`
  background-color: transparent;
  border-radius: 8px;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  display: flex;
  padding: 2px 0px;
  opacity: 1;

  ${OpacityHoverState}
`

const Collection = () => {
  const { contractAddress } = useParams()
  const isMobile = useIsMobile()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isActivityToggled = pathname.includes('/activity')
  const setMarketCount = useCollectionFilters((state) => state.setMarketCount)
  const isBagExpanded = useBag((state) => state.bagExpanded)
  const setBagExpanded = useBag((state) => state.setBagExpanded)
  const { chainId } = useWeb3React()
  const screenSize = useScreenSize()

  const { data: collectionStats, loading } = useCollection(contractAddress as string)

  const { CollectionContainerWidthChange } = useSpring({
    CollectionContainerWidthChange:
      isBagExpanded && !isMobile ? (screenSize['xxxl'] ? XXXL_BAG_WIDTH : BAG_WIDTH) + 16 : 0,
    config: {
      duration: TRANSITION_DURATIONS.medium,
      easing: easings.easeOutSine,
    },
  })

  const { gridWidthOffset } = useSpring({
    gridWidthOffset: isFiltersExpanded && !isMobile ? FILTER_WIDTH : 0,
    config: {
      duration: TRANSITION_DURATIONS.medium,
      easing: easings.easeOutSine,
    },
  })

  useEffect(() => {
    const marketCount: Record<string, number> = {}
    collectionStats?.marketplaceCount?.forEach(({ marketplace, count }) => {
      marketCount[marketplace] = count
    })
    setMarketCount(marketCount)
  }, [collectionStats?.marketplaceCount, setMarketCount])

  useEffect(() => {
    if (isBagExpanded && isFiltersExpanded && !screenSize['xl']) setFiltersExpanded(false)
  }, [isBagExpanded, isFiltersExpanded, screenSize, setFiltersExpanded])

  useEffect(() => {
    setBagExpanded({ bagExpanded: false, manualClose: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <CollectionPageSkeleton />

  const toggleActivity = () => {
    isActivityToggled
      ? navigate(`/nfts/collection/${contractAddress}`)
      : navigate(`/nfts/collection/${contractAddress}/activity`)
  }

  return (
    <>
      <Trace
        page={InterfacePageName.NFT_COLLECTION_PAGE}
        properties={{ collection_address: contractAddress, chain_id: chainId, is_activity_view: isActivityToggled }}
        shouldLogImpression
      >
        <AnimatedCollectionContainer
          style={{
            width: CollectionContainerWidthChange.to((x) => `calc(100% - ${x as number}px)`),
          }}
        >
          {contractAddress && !blocklistedCollections.includes(contractAddress) ? (
            <>
              <BannerWrapper>
                <Banner
                  src={
                    collectionStats?.bannerImageUrl ? `${collectionStats.bannerImageUrl}?w=${window.innerWidth}` : ''
                  }
                />
              </BannerWrapper>
              <CollectionDescriptionSection>
                {collectionStats && <CollectionStats stats={collectionStats} isMobile={isMobile} />}
                <div id="nft-anchor" />
                <ActivitySwitcher
                  showActivity={isActivityToggled}
                  toggleActivity={() => {
                    isFiltersExpanded && setFiltersExpanded(false)
                    toggleActivity()
                  }}
                />
              </CollectionDescriptionSection>
              <CollectionDisplaySection>
                <FiltersContainer isMobile={isMobile} isFiltersExpanded={isFiltersExpanded}>
                  {isFiltersExpanded && (
                    <>
                      {isMobile && (
                        <MobileFilterHeader>
                          <ThemedText.HeadlineSmall>Filter</ThemedText.HeadlineSmall>
                          <IconWrapper onClick={() => setFiltersExpanded(false)}>
                            <BagCloseIcon />
                          </IconWrapper>
                        </MobileFilterHeader>
                      )}
                      <Filters traitsByGroup={collectionStats?.traits ?? EMPTY_TRAIT_OBJ} />
                    </>
                  )}
                </FiltersContainer>

                <AnimatedCollectionAssetsContainer
                  hideUnderneath={isMobile && (isFiltersExpanded || isBagExpanded)}
                  style={{
                    transform: gridWidthOffset.to((x) => `translate(${x as number}px)`),
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
                      collectionStats && (
                        <Suspense fallback={<CollectionNftsAndMenuLoading />}>
                          <CollectionNfts
                            collectionStats={collectionStats}
                            contractAddress={contractAddress}
                            rarityVerified={collectionStats?.rarityVerified}
                          />
                        </Suspense>
                      )}
                </AnimatedCollectionAssetsContainer>
              </CollectionDisplaySection>
            </>
          ) : (
            <div className={styles.noCollectionAssets}>No collection assets exist at this address</div>
          )}
        </AnimatedCollectionContainer>
      </Trace>
      <MobileHoverBag />
    </>
  )
}

export default Collection
