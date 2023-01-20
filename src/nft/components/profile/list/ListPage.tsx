import { t, Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { SMALL_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { NftListV2Variant, useNftListV2Flag } from 'featureFlags/flags/nftListV2'
import { ListingButton } from 'nft/components/bag/profile/ListingButton'
import { getListingState, getTotalEthValue } from 'nft/components/bag/profile/utils'
import { BackArrowIcon } from 'nft/components/icons'
import { headlineLarge, headlineSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useNFTList, useProfilePageState, useSellAsset } from 'nft/hooks'
import { LIST_PAGE_MARGIN } from 'nft/pages/profile/shared'
import { ListingStatus, ProfilePageStateType } from 'nft/types'
import { fetchPrice, formatEth, formatUsdPrice } from 'nft/utils'
import { ListingMarkets } from 'nft/utils/listNfts'
import { useEffect, useMemo, useReducer, useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import { ListModal } from './Modal/ListModal'
import { NFTListingsGrid } from './NFTListingsGrid'
import { SelectMarketplacesDropdown } from './SelectMarketplacesDropdown'
import { SetDurationModal } from './SetDurationModal'

const TitleWrapper = styled(Row)`
  gap: 4px;
  margin-bottom: 18px;
  white-space: nowrap;
  width: min-content;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    margin-bottom: 0px;
  }
`

const ButtonsWrapper = styled(Row)`
  gap: 12px;
  width: min-content;
`

const MarketWrap = styled.section<{ isNftListV2: boolean }>`
  gap: 48px;
  margin: 0px auto;
  width: 100%;
  max-width: 1200px;
  ${({ isNftListV2 }) => !isNftListV2 && v1Padding}
`

const v1Padding = css`
  padding: 0px 16px;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    padding: 0px 44px;
  }
`

const ListingHeader = styled(Row)`
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: 18px;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    margin-top: 16px;
  }
`

const GridWrapper = styled.div`
  margin-top: 24px;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    margin-left: 40px;
  }
`

const MobileListButtonWrapper = styled.div`
  display: flex;
  margin: 14px 16px 32px 16px;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

const FloatingConfirmationBar = styled(Row)`
  padding: 20px 32px;
  border: 1px solid;
  border-color: ${({ theme }) => theme.backgroundOutline};
  border-radius: 20px;
  white-space: nowrap;
  justify-content: space-between;
  background: ${({ theme }) => theme.backgroundSurface};
  position: fixed;
  bottom: 32px;
  width: calc(100vw - ${LIST_PAGE_MARGIN * 2}px);
  left: 50%;
  transform: translateX(-50%);
  max-width: 1200px;
  z-index: ${Z_INDEX.under_dropdown};
`

const Overlay = styled.div`
  position: fixed;
  bottom: 0px;
  height: 158px;
  width: 100vw;
  background: ${({ theme }) => `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, ${theme.backgroundBackdrop} 100%)`};
`

const ProceedsAndButtonWrapper = styled(Row)`
  width: min-content;
  gap: 40px;
`

const ProceedsWrapper = styled(Row)`
  width: min-content;
  gap: 16px;
`

const ListingButtonWrapper = styled.div`
  width: 170px;
`

export const ListPage = () => {
  const { setProfilePageState: setSellPageState } = useProfilePageState()
  const setGlobalMarketplaces = useSellAsset((state) => state.setGlobalMarketplaces)
  const [selectedMarkets, setSelectedMarkets] = useState([ListingMarkets[0]]) // default marketplace: x2y2
  const toggleBag = useBag((s) => s.toggleBag)
  const listings = useNFTList((state) => state.listings)
  const collectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const listingStatus = useNFTList((state) => state.listingStatus)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const isMobile = useIsMobile()
  const isNftListV2 = useNftListV2Flag() === NftListV2Variant.Enabled

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const anyListingsMissingPrice = useMemo(() => !!listings.find((listing) => !listing.price), [listings])
  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)
  const [showListModal, toggleShowListModal] = useReducer((s) => !s, false)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price ?? 0)
    })
  }, [])

  useEffect(() => {
    const state = getListingState(collectionsRequiringApproval, listings)

    if (state.allListingsApproved) setListingStatus(ListingStatus.APPROVED)
    else if (state.anyPaused && !state.anyActiveFailures && !state.anyActiveSigning && !state.anyActiveRejections) {
      setListingStatus(ListingStatus.CONTINUE)
    } else if (state.anyPaused) setListingStatus(ListingStatus.PAUSED)
    else if (state.anyActiveSigning) setListingStatus(ListingStatus.SIGNING)
    else if (state.allListingsPending || (state.allCollectionsPending && state.allListingsDefined))
      setListingStatus(ListingStatus.PENDING)
    else if (state.anyActiveFailures && listingStatus !== ListingStatus.PAUSED) setListingStatus(ListingStatus.FAILED)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, collectionsRequiringApproval])

  useEffect(() => {
    setGlobalMarketplaces(selectedMarkets)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkets])

  return (
    <Column>
      <MarketWrap isNftListV2={isNftListV2}>
        <ListingHeader>
          <TitleWrapper>
            <BackArrowIcon
              height={isMobile ? 20 : 32}
              width={isMobile ? 20 : 32}
              fill={themeVars.colors.textSecondary}
              onClick={() => setSellPageState(ProfilePageStateType.VIEWING)}
              cursor="pointer"
            />
            <div className={isMobile ? headlineSmall : headlineLarge}>Sell NFTs</div>
          </TitleWrapper>
          <ButtonsWrapper>
            <SelectMarketplacesDropdown setSelectedMarkets={setSelectedMarkets} selectedMarkets={selectedMarkets} />
            <SetDurationModal />
          </ButtonsWrapper>
        </ListingHeader>
        <GridWrapper>
          <NFTListingsGrid selectedMarkets={selectedMarkets} />
        </GridWrapper>
      </MarketWrap>
      {isNftListV2 && (
        <>
          <FloatingConfirmationBar>
            <ThemedText.HeadlineSmall lineHeight="28px">
              <Trans>Proceeds if sold</Trans>
            </ThemedText.HeadlineSmall>
            <ProceedsAndButtonWrapper>
              <ProceedsWrapper>
                <ThemedText.HeadlineSmall
                  lineHeight="28px"
                  color={totalEthListingValue ? 'textPrimary' : 'textTertiary'}
                >
                  {totalEthListingValue > 0 ? formatEth(totalEthListingValue) : '-'} ETH
                </ThemedText.HeadlineSmall>
                {!!totalEthListingValue && !!ethPriceInUSD && (
                  <ThemedText.HeadlineSmall lineHeight="28px" color="textSecondary">
                    {formatUsdPrice(totalEthListingValue * ethPriceInUSD)}
                  </ThemedText.HeadlineSmall>
                )}
              </ProceedsWrapper>
              <ListingButtonWrapper>
                <ListingButton
                  onClick={isNftListV2 ? toggleShowListModal : toggleBag}
                  buttonText={anyListingsMissingPrice ? t`Set prices to continue` : t`Start listing`}
                />
              </ListingButtonWrapper>
            </ProceedsAndButtonWrapper>
          </FloatingConfirmationBar>
          <Overlay />
        </>
      )}
      {!isNftListV2 && (
        <MobileListButtonWrapper>
          <ListingButton onClick={toggleBag} buttonText="Continue listing" />
        </MobileListButtonWrapper>
      )}
      {isNftListV2 && showListModal && (
        <>
          <ListModal overlayClick={toggleShowListModal} />
        </>
      )}
    </Column>
  )
}
