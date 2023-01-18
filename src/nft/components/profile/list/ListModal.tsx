import ListingModal from 'nft/components/bag/profile/ListingModal'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import styled from 'styled-components/macro'
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
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  box-shadow: ${({ theme }) => theme.deepShadow};
  padding: 0px 12px 4px;
`

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  return (
    <Portal>
      <ListModalWrapper>
        <ListingModal />
      </ListModalWrapper>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
