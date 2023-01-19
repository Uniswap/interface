import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
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

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  return (
    <Portal>
      <ListModalWrapper>
        <TitleRow>
          <ThemedText.HeadlineSmall lineHeight="28px">
            <Trans>List NFTs</Trans>
          </ThemedText.HeadlineSmall>
          <X size={24} cursor="pointer" onClick={overlayClick} />
        </TitleRow>
        <span>Approvals</span>
        <span>Listings</span>
      </ListModalWrapper>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
