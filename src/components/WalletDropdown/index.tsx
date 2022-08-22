import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { useWalletFlag, WalletVariant } from 'featureFlags/flags/wallet'
import { useMemo, useRef } from 'react'
import { useState } from 'react'
import styled from 'styled-components/macro'

import { useModalIsOpen } from '../../state/application/hooks'
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

const WalletDropdownWrapper = styled.div`
  position: absolute;
  top: 65px;
  right: 20px;
`

const WalletDropdown = () => {
  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const walletFlag = useWalletFlag()
  const redesignFlag = useRedesignFlag()
  const walletModalOpen = useModalIsOpen(ApplicationModal.WALLET_DROPDOWN)

  const isOpen = useMemo(
    () => (redesignFlag === RedesignVariant.Enabled || walletFlag === WalletVariant.Enabled) && walletModalOpen,
    [redesignFlag, walletFlag, walletModalOpen]
  )

  const ref = useRef<HTMLDivElement>(null)
  // import { useCloseModal } from '../../state/application/hooks'
  // const closeModal = useCloseModal(ApplicationModal.WALLET_DROPDOWN)
  // useOnClickOutside(ref, isOpen ? closeModal : undefined)

  return (
    <>
      {isOpen && (
        <WalletDropdownWrapper ref={ref}>
          <WalletWrapper>
            {menu === MenuState.TRANSACTIONS && <TransactionHistoryMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
            {menu === MenuState.LANGUAGE && <LanguageMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
            {menu === MenuState.DEFAULT && <DefaultMenu setMenu={setMenu} />}
          </WalletWrapper>
        </WalletDropdownWrapper>
      )}
    </>
  )
}

export default WalletDropdown
