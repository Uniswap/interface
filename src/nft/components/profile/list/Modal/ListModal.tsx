import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, useTrace } from '@uniswap/analytics'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import Row from 'components/Row'
import { getTotalEthValue, signListingRow } from 'nft/components/bag/profile/utils'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { useNFTList, useSellAsset } from 'nft/hooks'
import { ListingStatus } from 'nft/types'
import { fetchPrice } from 'nft/utils'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import { ListModalSection, Section } from './ListModalSection'

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

const TitleRow = styled(Row)`
  justify-content: space-between;
  margin-bottom: 8px;
`

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  const { provider } = useWeb3React()
  const signer = provider?.getSigner()
  const trace = useTrace({ modal: InterfaceModalName.NFT_LISTING })
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const listings = useNFTList((state) => state.listings)
  const collectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const listingStatus = useNFTList((state) => state.listingStatus)
  const setListings = useNFTList((state) => state.setListings)
  const setLooksRareNonce = useNFTList((state) => state.setLooksRareNonce)
  const getLooksRareNonce = useNFTList((state) => state.getLooksRareNonce)

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const [openSection, toggleOpenSection] = useReducer(
    (s) => (s === Section.APPROVE ? Section.SIGN : Section.APPROVE),
    Section.APPROVE
  )
  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price || 0)
    })
  }, [])

  const allCollectionsApproved = useMemo(
    () => collectionsRequiringApproval.every((collection) => collection.status === ListingStatus.APPROVED),
    [collectionsRequiringApproval]
  )

  const signListings = async () => {
    if (!signer || !provider) return
    // sign listings
    for (const listing of listings) {
      await signListingRow(listing, listings, setListings, signer, provider, getLooksRareNonce, setLooksRareNonce)
    }
    sendAnalyticsEvent(NFTEventName.NFT_LISTING_COMPLETED, {
      signatures_approved: listings.filter((asset) => asset.status === ListingStatus.APPROVED),
      list_quantity: listings.length,
      usd_value: ethPriceInUSD * totalEthListingValue,
      ...trace,
    })
  }

  useEffect(() => {
    if (allCollectionsApproved) {
      signListings()
      openSection === Section.APPROVE && toggleOpenSection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCollectionsApproved])

  return (
    <Portal>
      <Trace modal={InterfaceModalName.NFT_LISTING}>
        <ListModalWrapper>
          {listingStatus === ListingStatus.APPROVED ? (
            <>TODO Success Screen</>
          ) : (
            <>
              <TitleRow>
                <ThemedText.HeadlineSmall lineHeight="28px">
                  <Trans>List NFTs</Trans>
                </ThemedText.HeadlineSmall>
                <X size={24} cursor="pointer" onClick={overlayClick} />
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
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
