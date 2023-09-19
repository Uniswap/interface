import { Trans } from '@lingui/macro'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import Column from 'components/Column'
import Row from 'components/Row'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ListingButton } from 'nft/components/profile/list/ListingButton'
import {
  approveCollectionRow,
  getTotalEthValue,
  useSubscribeListingState,
  verifyStatus,
} from 'nft/components/profile/list/utils'
import { useIsMobile, useNFTList, useProfilePageState, useSellAsset } from 'nft/hooks'
import { LIST_PAGE_MARGIN, LIST_PAGE_MARGIN_MOBILE } from 'nft/pages/profile/shared'
import { looksRareNonceFetcher } from 'nft/queries'
import { ProfilePageStateType } from 'nft/types'
import { formatEth } from 'nft/utils'
import { ListingMarkets } from 'nft/utils/listNfts'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components'
import { BREAKPOINTS, ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { ListModal } from './Modal/ListModal'
import { NFTListingsGrid } from './NFTListingsGrid'
import { SelectMarketplacesDropdown } from './SelectMarketplacesDropdown'
import { SetDurationModal } from './SetDurationModal'

const ListingHeader = styled(Column)`
  gap: 16px;
  margin-top: 36px;

  @media screen and (min-width: ${BREAKPOINTS.xs}px) {
    gap: 4px;
  }
`

const ArrowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    height: 40px;
    width: 40px;
  }
`

const BackArrow = styled(ArrowLeft)`
  height: 16px;
  width: 16px;
  cursor: pointer;
  color: ${({ theme }) => theme.neutral2};

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    height: 20px;
    width: 20px;
  }
`

const TitleWrapper = styled(Row)`
  gap: 4px;
  margin-bottom: 12px;
  white-space: nowrap;
  width: min-content;
  font-weight: 535;
  font-size: 20px;
  line-height: 28px;

  @media screen and (min-width: ${BREAKPOINTS.xs}px) {
    margin-bottom: 0px;
    font-weight: 535;
    font-size: 28px;
    line-height: 36px;
  }
`

const ButtonsWrapper = styled(Row)`
  gap: 12px;
  width: min-content;
`

const MarketWrap = styled.section`
  gap: 48px;
  margin: 0px auto;
  width: 100%;
  max-width: 1200px;
`

const ListingHeaderRow = styled(Row)`
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    padding-left: 40px;
  }
`

const GridWrapper = styled.div`
  margin-top: 24px;
  margin-bottom: 48px;
`

const FloatingConfirmationBar = styled(Row)<{ issues: boolean }>`
  padding: 12px 12px 12px 32px;
  border: 1px solid;
  border-color: ${({ theme, issues }) => (issues ? theme.surface3 : theme.accent1)};
  border-radius: 20px;
  white-space: nowrap;
  justify-content: space-between;
  background: ${({ theme }) => theme.surface1};
  position: fixed;
  bottom: 32px;
  width: calc(100vw - ${LIST_PAGE_MARGIN * 2}px);
  left: 50%;
  transform: translateX(-50%);
  max-width: ${({ theme }) => theme.maxWidth};
  z-index: ${Z_INDEX.under_dropdown};
  box-shadow: ${({ theme }) => theme.deprecated_shallowShadow};

  @media screen and (max-width: ${BREAKPOINTS.lg}px) {
    bottom: 68px;
  }

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    width: calc(100% - ${LIST_PAGE_MARGIN_MOBILE * 2}px);
    padding: 8px 8px 8px 16px;
  }
`

const Overlay = styled.div`
  position: fixed;
  bottom: 0px;
  left: 0px;
  height: 158px;
  width: 100vw;
  background: ${({ theme }) => `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, ${theme.surface2} 100%)`};
`

const UsdValue = styled(ThemedText.SubHeader)`
  line-height: 24px;
  color: ${({ theme }) => theme.neutral2};
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
  font-weight: 535;
  font-size: 20px;
  line-height: 28px;
  color: ${({ theme, totalEthListingValue }) => (totalEthListingValue ? theme.neutral1 : theme.neutral2)};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    font-size: 16px;
    line-height: 24px;
  }
`

export const ListPage = () => {
  const { setProfilePageState: setSellPageState } = useProfilePageState()
  const { provider, chainId } = useWeb3React()
  const isMobile = useIsMobile()
  const trace = useTrace({ modal: InterfaceModalName.NFT_LISTING })
  const { formatCurrencyAmount } = useFormatter()
  const { setGlobalMarketplaces, sellAssets, issues } = useSellAsset(
    ({ setGlobalMarketplaces, sellAssets, issues }) => ({
      setGlobalMarketplaces,
      sellAssets,
      issues,
    })
  )
  const { listings, collectionsRequiringApproval, setLooksRareNonce, setCollectionStatusAndCallback } = useNFTList(
    ({ listings, collectionsRequiringApproval, setLooksRareNonce, setCollectionStatusAndCallback }) => ({
      listings,
      collectionsRequiringApproval,
      setLooksRareNonce,
      setCollectionStatusAndCallback,
    })
  )

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const nativeCurrency = useNativeCurrency(chainId)
  const parsedAmount = tryParseCurrencyAmount(totalEthListingValue.toString(), nativeCurrency)
  const usdcValue = useStablecoinValue(parsedAmount)
  const usdcAmount = formatCurrencyAmount({
    amount: usdcValue,
    type: NumberType.FiatTokenPrice,
  })
  const [showListModal, toggleShowListModal] = useReducer((s) => !s, false)
  const [selectedMarkets, setSelectedMarkets] = useState([ListingMarkets[0]]) // default marketplace: x2y2
  const signer = provider?.getSigner()

  // instantiate listings and collections to approve when users modify input data
  useSubscribeListingState()

  useEffect(() => {
    setGlobalMarketplaces(selectedMarkets)
  }, [selectedMarkets, setGlobalMarketplaces])

  const startListingEventProperties = {
    collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
    token_ids: sellAssets.map((asset) => asset.tokenId),
    marketplaces: Array.from(new Set(listings.map((asset) => asset.marketplace.name))),
    list_quantity: listings.length,
    usd_value: usdcAmount,
    ...trace,
  }

  const startListingFlow = async () => {
    if (!signer) return
    sendAnalyticsEvent(NFTEventName.NFT_SELL_START_LISTING, { ...startListingEventProperties })
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

  const showModalAndStartListing = () => {
    toggleShowListModal()
    startListingFlow()
  }

  const BannerText = isMobile ? (
    <ThemedText.SubHeader>
      <Trans>Receive</Trans>
    </ThemedText.SubHeader>
  ) : (
    <ThemedText.HeadlineSmall lineHeight="28px">
      <Trans>You receive</Trans>
    </ThemedText.HeadlineSmall>
  )

  return (
    <Column>
      <MarketWrap>
        <ListingHeader>
          <Row>
            <ArrowContainer>
              <BackArrow onClick={() => setSellPageState(ProfilePageStateType.VIEWING)} />
            </ArrowContainer>
            <ThemedText.BodySmall lineHeight="20px" color="neutral2">
              <Trans>My NFTs</Trans>
            </ThemedText.BodySmall>
          </Row>
          <ListingHeaderRow>
            <TitleWrapper>
              <Trans>Sell NFTs</Trans>
            </TitleWrapper>
            <ButtonsWrapper>
              <SelectMarketplacesDropdown setSelectedMarkets={setSelectedMarkets} selectedMarkets={selectedMarkets} />
              <SetDurationModal />
            </ButtonsWrapper>
          </ListingHeaderRow>
        </ListingHeader>
        <GridWrapper>
          <NFTListingsGrid selectedMarkets={selectedMarkets} />
        </GridWrapper>
      </MarketWrap>

      <FloatingConfirmationBar issues={!!issues}>
        {BannerText}
        <ProceedsAndButtonWrapper>
          <ProceedsWrapper>
            <EthValueWrapper totalEthListingValue={!!totalEthListingValue}>
              {totalEthListingValue > 0 ? formatEth(totalEthListingValue) : '-'} ETH
            </EthValueWrapper>
            {!!usdcValue && <UsdValue>{usdcAmount}</UsdValue>}
          </ProceedsWrapper>
          <ListingButton onClick={showModalAndStartListing} />
        </ProceedsAndButtonWrapper>
      </FloatingConfirmationBar>
      <Overlay />

      {showListModal && <ListModal overlayClick={toggleShowListModal} />}
    </Column>
  )
}
