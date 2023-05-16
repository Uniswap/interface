import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, useTrace } from '@uniswap/analytics'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { getTotalEthValue, signListingRow } from 'nft/components/profile/list/utils'
import { useNFTList, useSellAsset } from 'nft/hooks'
import { ListingStatus } from 'nft/types'
import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { shallow } from 'zustand/shallow'

import { TitleRow } from '../shared'
import { ListModalSection, Section } from './ListModalSection'
import { SuccessScreen } from './SuccessScreen'

const ListModalWrapper = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  z-index: ${Z_INDEX.modal};
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: ${({ theme }) => theme.deepShadow};
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    width: 100%;
    height: 100%;
  }
`

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  const { provider, chainId } = useWeb3React()
  const signer = provider?.getSigner()
  const trace = useTrace({ modal: InterfaceModalName.NFT_LISTING })
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const { setListingStatusAndCallback, setLooksRareNonce, getLooksRareNonce, collectionsRequiringApproval, listings } =
    useNFTList(
      ({
        setListingStatusAndCallback,
        setLooksRareNonce,
        getLooksRareNonce,
        collectionsRequiringApproval,
        listings,
      }) => ({
        setListingStatusAndCallback,
        setLooksRareNonce,
        getLooksRareNonce,
        collectionsRequiringApproval,
        listings,
      }),
      shallow
    )

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const [openSection, toggleOpenSection] = useReducer(
    (s) => (s === Section.APPROVE ? Section.SIGN : Section.APPROVE),
    Section.APPROVE
  )
  const nativeCurrency = useNativeCurrency(chainId)
  const parsedAmount = tryParseCurrencyAmount(totalEthListingValue.toString(), nativeCurrency)
  const usdcValue = useStablecoinValue(parsedAmount)
  const usdcAmount = formatCurrencyAmount(usdcValue, NumberType.FiatTokenPrice)

  const allCollectionsApproved = useMemo(
    () => collectionsRequiringApproval.every((collection) => collection.status === ListingStatus.APPROVED),
    [collectionsRequiringApproval]
  )

  const allListingsApproved = useMemo(
    () => listings.every((listing) => listing.status === ListingStatus.APPROVED),
    [listings]
  )

  const signListings = async () => {
    if (!signer || !provider) return
    // sign listings
    for (const listing of listings) {
      await signListingRow(listing, signer, provider, getLooksRareNonce, setLooksRareNonce, setListingStatusAndCallback)
    }

    sendAnalyticsEvent(NFTEventName.NFT_LISTING_COMPLETED, {
      signatures_approved: listings.filter((asset) => asset.status === ListingStatus.APPROVED),
      list_quantity: listings.length,
      usd_value: usdcAmount,
      ...trace,
    })
  }

  // Once all collections have been approved, go to next section and start signing listings
  useEffect(() => {
    if (allCollectionsApproved) {
      signListings()
      openSection === Section.APPROVE && toggleOpenSection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCollectionsApproved])

  const closeModalOnClick = useCallback(() => {
    allListingsApproved ? window.location.reload() : overlayClick()
  }, [allListingsApproved, overlayClick])

  // In the case that a user removes all listings via retry logic, close modal
  useEffect(() => {
    !listings.length && closeModalOnClick()
  }, [listings, closeModalOnClick])

  return (
    <Portal>
      <Trace modal={InterfaceModalName.NFT_LISTING}>
        <ListModalWrapper>
          {allListingsApproved ? (
            <SuccessScreen overlayClick={closeModalOnClick} />
          ) : (
            <>
              <TitleRow>
                <ThemedText.HeadlineSmall lineHeight="28px">
                  <Trans>List NFTs</Trans>
                </ThemedText.HeadlineSmall>
                <X size={24} cursor="pointer" onClick={closeModalOnClick} />
              </TitleRow>
              <ListModalSection
                sectionType={Section.APPROVE}
                active={openSection === Section.APPROVE}
                content={collectionsRequiringApproval}
                toggleSection={toggleOpenSection}
              />
              <ListModalSection
                sectionType={Section.SIGN}
                active={openSection === Section.SIGN}
                content={listings}
                toggleSection={toggleOpenSection}
              />
            </>
          )}
        </ListModalWrapper>
      </Trace>
      <Overlay onClick={closeModalOnClick} />
    </Portal>
  )
}
