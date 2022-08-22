import { DialogOverlay } from '@reach/dialog'
import { useWalletFlag, WalletVariant } from 'featureFlags/flags/wallet'
import { useState } from 'react'
import styled from 'styled-components/macro'

import { useModalIsOpen, useToggleWalletModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import DefaultMenu from './DefaultMenu'
import LanguageMenu from './LanguageMenu'
import { TransactionHistoryMenu } from './TransactionMenu'

const WalletWrapper = styled.div`
  border-radius: 12px;
  width: 320px;
  max-height: 376px;

  display: flex;
  flex-direction: column;
  font-size: 16px;
  top: 60px;
  right: 70px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  padding: 16px 0;
`

export enum MenuState {
  DEFAULT = 'DEFAULT',
  LANGUAGE = 'LANGUAGE',
  TRANSACTIONS = 'TRANSACTIONS',
}

const StyledDialogOverlay = styled(DialogOverlay)`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    background-color: transparent;
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const WalletDropdownWrapper = styled.div`
  position: absolute;
  top: 65px;
  right: 20px;
`

const WalletDropdown = () => {
  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const walletFlag = useWalletFlag()
  const walletModalOpen = useModalIsOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useToggleWalletModal()

  return (
    <>
      {walletFlag === WalletVariant.Enabled && walletModalOpen && (
        <StyledDialogOverlay onClick={toggleWalletModal}>
          <WalletDropdownWrapper>
            <WalletWrapper>
              {menu === MenuState.TRANSACTIONS && <TransactionHistoryMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
              {menu === MenuState.LANGUAGE && <LanguageMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
              {menu === MenuState.DEFAULT && <DefaultMenu setMenu={setMenu} />}
            </WalletWrapper>
          </WalletDropdownWrapper>
        </StyledDialogOverlay>
      )}
    </>
  )
}

export default WalletDropdown
