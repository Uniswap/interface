import { useState } from 'react'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import { useModalIsOpen } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import DefaultMenu from './DefaultMenu'
import LanguageMenu from './LanguageMenu'
import { TransactionHistoryMenu } from './TransactionMenu'

const WalletDropdownAnchor = styled.div`
  position: fixed;
  top: 72px;
  right: 20px;
  z-index: ${Z_INDEX.dropdown};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    top: unset;
    left: 0;
    right: 0;
    bottom: 56px;
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
  padding: 16px;

  box-shadow: ${({ theme }) => theme.deepShadow};

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

  return (
    <>
      {walletDropdownOpen && (
        <WalletDropdownAnchor>
          <WalletDropdownWrapper>
            {menu === MenuState.DEFAULT && <DefaultMenu setMenu={setMenu} />}
            {menu === MenuState.TRANSACTIONS && <TransactionHistoryMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
            {menu === MenuState.LANGUAGE && <LanguageMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
          </WalletDropdownWrapper>
        </WalletDropdownAnchor>
      )}
    </>
  )
}

export default WalletDropdown
