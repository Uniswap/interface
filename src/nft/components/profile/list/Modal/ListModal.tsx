import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import Row from 'components/Row'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { ProfileMethod, useNFTList, useSellAsset } from 'nft/hooks'
import { CollectionRow, ListingStatus, WalletAsset } from 'nft/types'
import { useEffect, useReducer } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import { ListModalSection, Section, SectionHeaderOnly } from './ListModalSection'

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
`

const TitleRow = styled(Row)`
  justify-content: space-between;
  margin-bottom: 8px;
`

const getUniqueCollections = (sellAssets: WalletAsset[]): CollectionRow[] => {
  const newCollectionsToApprove: CollectionRow[] = []

  sellAssets.forEach((asset) => {
    if (
      !newCollectionsToApprove.some(
        (collectionRow: CollectionRow) => collectionRow.collectionAddress === asset.asset_contract.address
      )
    ) {
      const newCollectionRow = {
        images: [asset.asset_contract.image_url, ''],
        name: asset.asset_contract.name,
        status: ListingStatus.DEFINED,
        collectionAddress: asset.asset_contract.address,
        isVerified: asset.collectionIsVerified,
      }
      newCollectionsToApprove.push(newCollectionRow)
    }
  })
  return newCollectionsToApprove
}

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const listings = useNFTList((state) => state.listings)
  const listingCollectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const setCollectionsRequiringApproval = useNFTList((state) => state.setCollectionsRequiringApproval)
  const [openSection, toggleOpenSection] = useReducer(
    (s) => (s === Section.APPROVE ? Section.SIGN : Section.APPROVE),
    Section.APPROVE
  )
  const profileMethod = useSellAsset((state) => state.profileMethod)
  const isListing = profileMethod === ProfileMethod.LIST

  useEffect(() => {
    if (!isListing) {
      const newCollectionsToApprove = getUniqueCollections(sellAssets)
      setCollectionsRequiringApproval(newCollectionsToApprove)
      setListingStatus(ListingStatus.DEFINED)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellAssets])

  return (
    <Portal>
      <Trace modal={InterfaceModalName.NFT_LISTING}>
        <ListModalWrapper>
          <TitleRow>
            <ThemedText.HeadlineSmall lineHeight="28px">
              <Trans>
                {profileMethod === ProfileMethod.LIST ? 'List' : profileMethod === ProfileMethod.SEND ? 'Send' : 'Burn'}{' '}
                NFTs
              </Trans>
            </ThemedText.HeadlineSmall>
            <X size={24} cursor="pointer" onClick={overlayClick} />
          </TitleRow>
          <ListModalSection
            sectionType={Section.APPROVE}
            active={openSection === Section.APPROVE}
            content={listingCollectionsRequiringApproval}
            toggleSection={toggleOpenSection}
          />
          {isListing && (
            <ListModalSection
              sectionType={Section.SIGN}
              active={openSection === Section.SIGN}
              content={listings}
              toggleSection={toggleOpenSection}
            />
          )}
          {!isListing && <SectionHeaderOnly active={openSection === Section.SIGN} />}
        </ListModalWrapper>
      </Trace>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
