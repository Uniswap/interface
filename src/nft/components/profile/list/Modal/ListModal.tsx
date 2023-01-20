import { Plural, Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { Portal } from 'nft/components/common/Portal'
import {
  ChevronUpIcon,
  ListingModalWindowActive,
  ListingModalWindowClosed,
  LoadingIcon,
  VerifiedIcon,
} from 'nft/components/icons'
import { Overlay } from 'nft/components/modals/Overlay'
import { useNFTList } from 'nft/hooks'
import { useReducer } from 'react'
import { Info, X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'
import { TRANSITION_DURATIONS } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'

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

const SectionHeader = styled(Row)`
  justify-content: space-between;
`

const SectionTitle = styled(ThemedText.SubHeader)<{ active: boolean }>`
  line-height: 24px;
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textSecondary)};
`

const SectionArrow = styled(ChevronUpIcon)<{ active: boolean }>`
  height: 24px;
  width: 24px;
  cursor: pointer;
  transition: ${TRANSITION_DURATIONS.medium}ms;
  transform: rotate(${({ active }) => (active ? 0 : 180)}deg);
`

const SectionBody = styled(Column)`
  border-left: 1.5px solid ${colors.gray650};
  margin-top: 4px;
  margin-left: 7px;
  padding-top: 4px;
  padding-left: 20px;
  max-height: 394px;
  overflow-y: auto;
  ${ScrollBarStyles}
`

const StyledInfoIcon = styled(Info)`
  height: 16px;
  width: 16px;
  margin-left: 4px;
  color: ${({ theme }) => theme.textSecondary};
`

const ContentRowContainer = styled(Column)`
  gap: 8px;
`

const ContentRow = styled(Row)`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  opacity: 0.6;
`

const CollectionIcon = styled.img`
  border-radius: 100px;
  height: 24px;
  width: 24px;
  z-index: 1;
`

const AssetIcon = styled.img`
  border-radius: 4px;
  height: 24px;
  width: 24px;
  z-index: 1;
`

const MarketplaceIcon = styled.img`
  border-radius: 4px;
  height: 24px;
  width: 24px;
  margin-left: -4px;
  margin-right: 12px;
`

const CollectionName = styled(ThemedText.SubHeaderSmall)`
  color: ${({ theme }) => theme.textPrimary};
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipses;
`

const StyledVerifiedIcon = styled(VerifiedIcon)`
  height: 16px;
  width: 16px;
  margin-left: 4px;
`

const StyledLoadingIconBackground = styled(LoadingIcon)`
  height: 14px;
  width: 14px;
  stroke: ${({ theme }) => theme.textTertiary};
  margin-left: auto;
  margin-right: 0px;
`

const enum Section {
  APPROVE,
  SIGN,
}

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  const theme = useTheme()
  const listings = useNFTList((state) => state.listings)
  const collectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const [openSection, toggleOpenSection] = useReducer(
    (s) => (s === Section.APPROVE ? Section.SIGN : Section.APPROVE),
    Section.APPROVE
  )
  return (
    <Portal>
      <Trace modal={InterfaceModalName.NFT_LISTING}>
        <ListModalWrapper>
          <TitleRow>
            <ThemedText.HeadlineSmall lineHeight="28px">
              <Trans>List NFTs</Trans>
            </ThemedText.HeadlineSmall>
            <X size={24} cursor="pointer" onClick={overlayClick} />
          </TitleRow>
          <Column>
            <SectionHeader>
              <Row>
                {openSection === Section.APPROVE ? <ListingModalWindowActive /> : <ListingModalWindowClosed />}
                <SectionTitle active={openSection === Section.APPROVE} marginLeft="12px">
                  <Trans>Approve</Trans>&nbsp;{collectionsRequiringApproval.length}&nbsp;
                  <Plural value={collectionsRequiringApproval.length} _1="Collection" other="Collections" />
                </SectionTitle>
              </Row>
              <SectionArrow
                active={openSection === Section.APPROVE}
                secondaryColor={openSection === Section.APPROVE ? theme.textPrimary : theme.textSecondary}
                onClick={toggleOpenSection}
              />
            </SectionHeader>
            {openSection === Section.APPROVE && (
              <SectionBody>
                <Row height="16px" marginBottom="16px">
                  <ThemedText.Caption lineHeight="16px" color="textSecondary">
                    <Trans>Why is a transaction required?</Trans>
                  </ThemedText.Caption>
                  <MouseoverTooltip
                    text={
                      <Trans>Listing an NFT requires a one-time marketplace approval for each NFT collection.</Trans>
                    }
                  >
                    <StyledInfoIcon />
                  </MouseoverTooltip>
                </Row>
                <ContentRowContainer>
                  {collectionsRequiringApproval.map((collection, index) => {
                    return (
                      <ContentRow key={index}>
                        <CollectionIcon src={collection.images[0]} />
                        <MarketplaceIcon src={collection.images[1]} />
                        <CollectionName>{collection.name}</CollectionName>
                        {collection.isVerified && <StyledVerifiedIcon />}
                        <StyledLoadingIconBackground />
                      </ContentRow>
                    )
                  })}
                </ContentRowContainer>
              </SectionBody>
            )}
          </Column>
          <Column>
            <SectionHeader>
              <Row>
                {openSection === Section.SIGN ? <ListingModalWindowActive /> : <ListingModalWindowClosed />}
                <SectionTitle active={openSection === Section.SIGN} marginLeft="12px">
                  <Trans>Sign</Trans> &nbsp;{listings.length}&nbsp;{' '}
                  <Plural value={listings.length} _1="Listing" other="Listings" />
                </SectionTitle>
              </Row>
              <SectionArrow
                active={openSection === Section.SIGN}
                secondaryColor={openSection === Section.SIGN ? theme.textPrimary : theme.textSecondary}
                onClick={toggleOpenSection}
              />
            </SectionHeader>
            {openSection === Section.SIGN && (
              <SectionBody>
                <ContentRowContainer>
                  {listings.map((listing, index) => {
                    return (
                      <ContentRow key={index}>
                        <AssetIcon src={listing.images[0]} />
                        <MarketplaceIcon src={listing.images[1]} />
                        <CollectionName>{listing.name}</CollectionName>
                        <StyledLoadingIconBackground />
                      </ContentRow>
                    )
                  })}
                </ContentRowContainer>
              </SectionBody>
            )}
          </Column>
        </ListModalWrapper>
      </Trace>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
