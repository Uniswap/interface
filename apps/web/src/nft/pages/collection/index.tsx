import { InterfacePageName } from '@uniswap/analytics-events'
import { OpacityHoverState } from 'components/Common/styles'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useCollection } from 'graphql/data/nft/Collection'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { useAccount } from 'hooks/useAccount'
import styled from 'lib/styled-components'
import { BAG_WIDTH, XXXL_BAG_WIDTH } from 'nft/components/bag/Bag'
import { MobileHoverBag } from 'nft/components/bag/MobileHoverBag'
import { Activity, ActivitySwitcher, CollectionNfts, CollectionStats, Filters } from 'nft/components/collection'
import { CollectionNftsAndMenuLoading } from 'nft/components/collection/CollectionNfts'
import { CollectionPageSkeleton } from 'nft/components/collection/CollectionPageSkeleton'
import { UnavailableCollectionPage } from 'nft/components/collection/UnavailableCollectionPage'
import { BagCloseIcon } from 'nft/components/icons'
import { breakpointPaddingsCss } from 'nft/css/breakpoints'
import { useBag, useCollectionFilters, useFiltersExpanded } from 'nft/hooks'
import { useDynamicBlocklistedNftCollections } from 'nft/utils'
import { useDynamicMetatags } from 'pages/metatags'
import { Suspense, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { useMedia } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'

const FILTER_WIDTH = 332
const EMPTY_TRAIT_OBJ = {}

export const CollectionBannerLoading = styled(LoadingBubble)`
  width: 100%;
  height: 100%;
  border-radius: 0px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    border-radius: 16px;
  }
`

const CollectionContainer = styled(Column)`
  width: 100%;
  align-self: start;
  will-change: width;
`

const CollectionAssetsContainer = styled.div<{ hideUnderneath: boolean }>`
  position: ${({ hideUnderneath }) => (hideUnderneath ? 'fixed' : 'static')};
`

export const BannerWrapper = styled.div`
  height: 100px;
  max-width: 100%;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
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

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    border-radius: 16px;
  }
`

const CollectionDescriptionSection = styled(Column)`
  padding-left: 16px;
  padding-right: 16px;
  ${breakpointPaddingsCss}
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

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    top: 72px;
  }
`

const MobileFilterHeader = styled(Row)`
  padding: 20px 16px;
  justify-content: space-between;
`

// Sticky navbar on light mode looks incorrect because the box shadows from assets overlap the edges of the navbar.
// As a result it needs 16px padding on either side. These paddings are offset by 16px to account for this. Please see CollectionNFTs.css.tsx for the additional sizing context.
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
  const { t } = useTranslation()
  const { contractAddress } = useParams()
  const isMobile = useIsMobile()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isActivityToggled = pathname.includes('/activity')
  const setMarketCount = useCollectionFilters((state) => state.setMarketCount)
  const isBagExpanded = useBag((state) => state.bagExpanded)
  const setBagExpanded = useBag((state) => state.setBagExpanded)
  const { chainId } = useAccount()
  const media = useMedia()

  const { data: collectionStats, loading } = useCollection(contractAddress as string)

  const metaTagProperties = useMemo(() => {
    return {
      title: collectionStats.name + ' on Uniswap',
      image: window.location.origin + '/api/image/nfts/collection/' + contractAddress,
      url: window.location.href,
      description: collectionStats.description,
    }
  }, [collectionStats.description, collectionStats.name, contractAddress])
  const metaTags = useDynamicMetatags(metaTagProperties)

  useEffect(() => {
    const marketCount: Record<string, number> = {}
    collectionStats?.marketplaceCount?.forEach(({ marketplace, count }) => {
      marketCount[marketplace] = count
    })
    setMarketCount(marketCount)
  }, [collectionStats?.marketplaceCount, setMarketCount])

  useEffect(() => {
    if (isBagExpanded && isFiltersExpanded && media.xxl) {
      setFiltersExpanded(false)
    }
  }, [isBagExpanded, isFiltersExpanded, media, setFiltersExpanded])

  useEffect(() => {
    setBagExpanded({ bagExpanded: false, manualClose: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const blocklistedCollections = useDynamicBlocklistedNftCollections()

  if (loading) {
    return <CollectionPageSkeleton />
  }
  if (!collectionStats.name) {
    return <UnavailableCollectionPage />
  }

  const toggleActivity = () => {
    isActivityToggled
      ? navigate(`/nfts/collection/${contractAddress}`)
      : navigate(`/nfts/collection/${contractAddress}/activity`)
  }

  return (
    <>
      <Helmet>
        <title>
          {collectionStats.name} | {t(`nft.collection.title`)}
        </title>
        {metaTags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
        <meta name="robots" content="max-image-preview:large" />
      </Helmet>
      <Trace
        logImpression
        page={InterfacePageName.NFT_COLLECTION_PAGE}
        properties={{ collection_address: contractAddress, chain_id: chainId, is_activity_view: isActivityToggled }}
      >
        <CollectionContainer
          style={{
            width: `calc(100% - ${isBagExpanded && !isMobile ? (!media.xxxl ? XXXL_BAG_WIDTH : BAG_WIDTH) + 16 : 0}px)`,
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
                {/* eslint-disable-next-line react/forbid-elements */}
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

                <CollectionAssetsContainer
                  hideUnderneath={isMobile && (isFiltersExpanded || isBagExpanded)}
                  style={{
                    transform: `translate(${isFiltersExpanded && !isMobile ? FILTER_WIDTH : 0}px)`,
                    width: `calc(100% - ${isFiltersExpanded && !isMobile ? FILTER_WIDTH : 0}px)`,
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
                </CollectionAssetsContainer>
              </CollectionDisplaySection>
            </>
          ) : (
            <UnavailableCollectionPage isBlocked />
          )}
        </CollectionContainer>
      </Trace>
      <MobileHoverBag />
    </>
  )
}

export default Collection
