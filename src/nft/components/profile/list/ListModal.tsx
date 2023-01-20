import { Plural, Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import Column from 'components/Column'
import Row from 'components/Row'
import { Portal } from 'nft/components/common/Portal'
import { ChevronUpIcon, ListingModalWindowActive, ListingModalWindowClosed } from 'nft/components/icons'
import { Overlay } from 'nft/components/modals/Overlay'
import { useNFTList } from 'nft/hooks'
import { useReducer } from 'react'
import { X } from 'react-feather'
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
  z-index: ${Z_INDEX.modalOverTooltip};
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
  height: 280px; //TODO make dynamic
  border-left: 1.5px solid ${colors.gray650};
  margin: 4px 0px 0px 7px;
  padding-left: 20px;
  padding-top: 4px;
`

enum Section {
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
                <ThemedText.Caption lineHeight="16px" color="textSecondary">
                  <Trans>Why is a transaction required?</Trans>
                </ThemedText.Caption>
              </SectionBody>
            )}
          </Column>
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
        </ListModalWrapper>
      </Trace>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
