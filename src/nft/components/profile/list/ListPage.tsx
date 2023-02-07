import { t, Trans } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import Row from 'components/Row'
import { SMALL_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { NftListV2Variant, useNftListV2Flag } from 'featureFlags/flags/nftListV2'
import { ListingButton } from 'nft/components/bag/profile/ListingButton'
import { approveCollectionRow, getListingState, getTotalEthValue, verifyStatus } from 'nft/components/bag/profile/utils'
import { BackArrowIcon } from 'nft/components/icons'
import { headlineLarge, headlineSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useNFTList, useProfilePageState, useSellAsset } from 'nft/hooks'
import { LIST_PAGE_MARGIN, LIST_PAGE_MARGIN_MOBILE, LIST_PAGE_MARGIN_TABLET } from 'nft/pages/profile/shared'
import { looksRareNonceFetcher } from 'nft/queries'
import { ListingStatus, ProfilePageStateType } from 'nft/types'
import { fetchPrice, formatEth, formatUsdPrice } from 'nft/utils'
import { ListingMarkets } from 'nft/utils/listNfts'
import { useEffect, useMemo, useReducer, useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import shallow from 'zustand/shallow'

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
  margin-bottom: 48px;

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

  @media screen and (max-width: ${BREAKPOINTS.lg}px) {
    width: calc(100% - ${LIST_PAGE_MARGIN_TABLET * 2}px);
    bottom: 68px;
    padding: 16px 12px;
  }

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    width: calc(100% - ${LIST_PAGE_MARGIN_MOBILE * 2}px);
  }
`

const Overlay = styled.div`
  position: fixed;
  bottom: 0px;
  height: 158px;
  width: 100vw;
  background: ${({ theme }) => `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, ${theme.backgroundBackdrop} 100%)`};
`

const UsdValue = styled(ThemedText.SubHeader)`
  line-height: 24px;
  color: ${({ theme }) => theme.textSecondary};
  display: none;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: flex;
  }
`

const ProceedsAndButtonWrapper = styled(Row)`
  width: min-content;
  gap: 40px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    gap: 20px;
  }
`

const ProceedsWrapper = styled(Row)`
  width: min-content;
  gap: 16px;
`

const EthValueWrapper = styled.span<{ totalEthListingValue: boolean }>`
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
  color: ${({ theme, totalEthListingValue }) => (totalEthListingValue ? theme.textPrimary : theme.textSecondary)};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    font-size: 16px;
    line-height: 24px;
  }
`

const ListingButtonWrapper = styled.div`
  width: 170px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    width: max-content;
  }
`

export const ListPage = () => {
  const { setProfilePageState: setSellPageState } = useProfilePageState()
  const { provider } = useWeb3React()
  const toggleBag = useBag((s) => s.toggleBag)
  const isMobile = useIsMobile()
  const isNftListV2 = useNftListV2Flag() === NftListV2Variant.Enabled
  const trace = useTrace({ modal: InterfaceModalName.NFT_LISTING })
  const { setGlobalMarketplaces, sellAssets } = useSellAsset(
    ({ setGlobalMarketplaces, sellAssets }) => ({
      setGlobalMarketplaces,
      sellAssets,
    }),
    shallow
  )
  const {
    listings,
    collectionsRequiringApproval,
    listingStatus,
    setListingStatus,
    setLooksRareNonce,
    setCollectionStatusAndCallback,
  } = useNFTList(
    ({
      listings,
      collectionsRequiringApproval,
      listingStatus,
      setListingStatus,
      setLooksRareNonce,
      setCollectionStatusAndCallback,
    }) => ({
      listings,
      collectionsRequiringApproval,
      listingStatus,
      setListingStatus,
      setLooksRareNonce,
      setCollectionStatusAndCallback,
    }),
    shallow
  )

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const anyListingsMissingPrice = useMemo(() => !!listings.find((listing) => !listing.price), [listings])
  const [showListModal, toggleShowListModal] = useReducer((s) => !s, false)
  const [selectedMarkets, setSelectedMarkets] = useState([ListingMarkets[0]]) // default marketplace: x2y2
  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)
  const signer = provider?.getSigner()

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price ?? 0)
    })
  }, [])

  // TODO with removal of list v1 see if this logic can be removed
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
  }, [selectedMarkets, setGlobalMarketplaces])

  const startListingEventProperties = {
    collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
    token_ids: sellAssets.map((asset) => asset.tokenId),
    marketplaces: Array.from(new Set(listings.map((asset) => asset.marketplace.name))),
    list_quantity: listings.length,
    usd_value: ethPriceInUSD * totalEthListingValue,
    ...trace,
  }

  const startListingFlow = async () => {
    if (!signer) return
    sendAnalyticsEvent(NFTEventName.NFT_SELL_START_LISTING, { ...startListingEventProperties })
    setListingStatus(ListingStatus.SIGNING)
    const signerAddress = await signer.getAddress()
    const nonce = await looksRareNonceFetcher(signerAddress)
    setLooksRareNonce(nonce ?? 0)

    // for all unique collection, marketplace combos -> approve collections
    for (const collectionRow of collectionsRequiringApproval) {
      verifyStatus(collectionRow.status) &&
        (isMobile
          ? await approveCollectionRow(collectionRow, signer, setCollectionStatusAndCallback)
          : approveCollectionRow(collectionRow, signer, setCollectionStatusAndCallback))
    }
  }

  const handleV2Click = () => {
    toggleShowListModal()
    startListingFlow()
  }

  const BannerText = isMobile ? (
    <ThemedText.SubHeader lineHeight="24px">
      <Trans>Proceeds</Trans>
    </ThemedText.SubHeader>
  ) : (
    <ThemedText.HeadlineSmall lineHeight="28px">
      <Trans>Proceeds if sold</Trans>
    </ThemedText.HeadlineSmall>
  )

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
            {BannerText}
            <ProceedsAndButtonWrapper>
              <ProceedsWrapper>
                <EthValueWrapper totalEthListingValue={!!totalEthListingValue}>
                  {totalEthListingValue > 0 ? formatEth(totalEthListingValue) : '-'} ETH
                </EthValueWrapper>
                {!!totalEthListingValue && !!ethPriceInUSD && (
                  <UsdValue>{formatUsdPrice(totalEthListingValue * ethPriceInUSD)}</UsdValue>
                )}
              </ProceedsWrapper>
              <ListingButtonWrapper>
                <ListingButton
                  onClick={handleV2Click}
                  buttonText={anyListingsMissingPrice && !isMobile ? t`Set prices to continue` : t`Start listing`}
                  showWarningOverride={true}
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
