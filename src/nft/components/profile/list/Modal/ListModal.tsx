import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import Row from 'components/Row'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { useNFTList } from 'nft/hooks'
import { useReducer } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
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
`

const TitleRow = styled(Row)`
  justify-content: space-between;
  margin-bottom: 8px;
`

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
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
        </ListModalWrapper>
      </Trace>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
