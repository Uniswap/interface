import { useWindowSize } from 'hooks/useWindowSize'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import { useCloseModal, useModalIsOpen } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import DefaultMenu from './DefaultMenu'
import LanguageMenu from './LanguageMenu'
import { TransactionHistoryMenu } from './TransactionMenu'
import UniwalletModal from './UniwalletModal'

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

const WalletDropdownAnchor = styled.div`
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
  }
`

const WalletDropdownWrapper = styled.div`
  border-radius: 12px;
  width: 320px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  padding: 12px 16px 16px;

  box-shadow: ${({ theme }) => theme.deepShadow};
  padding: 16px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
    box-shadow: unset;
  }
`

export enum MenuState {
  DEFAULT = 'DEFAULT',
  LANGUAGE = 'LANGUAGE',
  TRANSACTIONS = 'TRANSACTIONS',
}

function WalletDropdown() {
  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const walletDropdownOpen = useModalIsOpen(ApplicationModal.WALLET_DROPDOWN)
  const uniwalletDropdownOpen = useModalIsOpen(ApplicationModal.UNIWALLET_CONNECT)
  const closeWalletDropdown = useCloseModal()

  return (
    <>
      <UniwalletModal />
      {Boolean(walletDropdownOpen || uniwalletDropdownOpen) && (
        <>
          <Scrim close={closeWalletDropdown} />
          <WalletDropdownAnchor>
            <WalletDropdownWrapper>
              {menu === MenuState.DEFAULT && <DefaultMenu setMenu={setMenu} />}
              {menu === MenuState.TRANSACTIONS && <TransactionHistoryMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
              {menu === MenuState.LANGUAGE && <LanguageMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
            </WalletDropdownWrapper>
          </WalletDropdownAnchor>
        </>
      )}
    </>
  )
}

export default WalletDropdown
