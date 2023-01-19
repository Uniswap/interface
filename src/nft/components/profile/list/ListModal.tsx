import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { Portal } from 'nft/components/common/Portal'
import { ChevronUpIcon, ListingModalWindowActive, ListingModalWindowClosed } from 'nft/components/icons'
import { Overlay } from 'nft/components/modals/Overlay'
import { useReducer } from 'react'
import { X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
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

enum Section {
  APPROVE,
  SIGN,
}

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  const theme = useTheme()
  const [openSection, toggleOpenSection] = useReducer(
    (s) => (s === Section.APPROVE ? Section.SIGN : Section.APPROVE),
    Section.APPROVE
  )
  return (
    <Portal>
      <ListModalWrapper>
        <TitleRow>
          <ThemedText.HeadlineSmall lineHeight="28px">
            <Trans>List NFTs</Trans>
          </ThemedText.HeadlineSmall>
          <X size={24} cursor="pointer" onClick={overlayClick} />
        </TitleRow>
        <SectionHeader>
          <Row>
            {openSection === Section.APPROVE ? <ListingModalWindowActive /> : <ListingModalWindowClosed />}
            <SectionTitle active={openSection === Section.APPROVE} marginLeft="12px">
              <Trans>Approve X Collections</Trans>
            </SectionTitle>
          </Row>
          <SectionArrow
            active={openSection === Section.APPROVE}
            secondaryColor={openSection === Section.APPROVE ? theme.textPrimary : theme.textSecondary}
            onClick={toggleOpenSection}
          />
        </SectionHeader>
        <SectionHeader>
          <Row>
            {openSection === Section.SIGN ? <ListingModalWindowActive /> : <ListingModalWindowClosed />}
            <SectionTitle active={openSection === Section.SIGN} marginLeft="12px">
              <Trans>Sign X Listings</Trans>
            </SectionTitle>
          </Row>
          <SectionArrow
            active={openSection === Section.SIGN}
            secondaryColor={openSection === Section.SIGN ? theme.textPrimary : theme.textSecondary}
            onClick={toggleOpenSection}
          />
        </SectionHeader>
      </ListModalWrapper>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
