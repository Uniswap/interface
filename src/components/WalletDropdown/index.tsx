import { ScrollBarStyles } from 'components/Common'
import { useWindowSize } from 'hooks/useWindowSize'
import { useEffect } from 'react'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import { useCloseModal, useModalIsOpen } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import DefaultMenu from './DefaultMenu'

const ScrimBackground = styled.div`
  z-index: ${Z_INDEX.modalBackdrop};
  overflow: hidden;
  top: 0;
  left: 0;
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.backgroundScrim};
  visibility: hidden;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    visibility: visible;
  }
`
const Scrim = ({ close }: { close: () => void }) => {
  const { width } = useWindowSize()

  useEffect(() => {
    if (width && width < BREAKPOINTS.sm) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'visible'
    }
  }, [width])

  const onClick = () => {
    close()
  }
  return <ScrimBackground onClick={onClick} />
}

const WalletDropdownWrapper = styled.div`
  position: fixed;
  top: 72px;
  right: 20px;
  z-index: ${Z_INDEX.dropdown};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    z-index: ${Z_INDEX.modal};
    top: unset;
    left: 0;
    right: 0;
    bottom: 0;

    width: 100%;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
    box-shadow: unset;
  }
  overflow-y: auto;
  ${ScrollBarStyles}
  height: fit-content;
  max-height: calc(100% - 80px);
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} max-height`};

  ::-webkit-scrollbar-track {
    margin-top: 40px;
    margin-bottom: 40px;
  }

  border-radius: 12px;
  width: 320px;
  font-size: 16px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  padding: 14px 16px 16px;

  box-shadow: ${({ theme }) => theme.deepShadow};
`

function WalletDropdown() {
  const walletDropdownOpen = useModalIsOpen(ApplicationModal.WALLET_DROPDOWN)
  const uniwalletModalOpen = useModalIsOpen(ApplicationModal.UNIWALLET_CONNECT)
  const closeWalletDropdown = useCloseModal()

  return walletDropdownOpen || uniwalletModalOpen ? (
    <>
      <Scrim close={closeWalletDropdown} />
      <WalletDropdownWrapper>
        <DefaultMenu />
      </WalletDropdownWrapper>
    </>
  ) : null
}

export default WalletDropdown
