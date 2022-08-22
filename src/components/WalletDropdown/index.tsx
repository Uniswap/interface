import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { useWalletFlag, WalletVariant } from 'featureFlags/flags/wallet'
import { useWindowSize } from 'hooks/useWindowSize'
import { useMemo, useState } from 'react'
import styled, { css } from 'styled-components/macro'

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

const WalletDesktop = css`
  top: 65px;
  right: 20px;
`

const WalletMobile = css`
  left: 50%;
  bottom: 45px;
  transform: translateX(-50%);
`

const WalletDropdownWrapper = styled.div<{ isMobile: boolean }>`
  position: absolute;
  ${({ isMobile }) => (isMobile ? WalletMobile : WalletDesktop)};
`

const WalletDropdown = () => {
  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const walletFlag = useWalletFlag()
  const redesignFlag = useRedesignFlag()
  const walletDropdownOpen = useModalIsOpen(ApplicationModal.WALLET_DROPDOWN)
  const { width: windowWidth } = useWindowSize()
  const isMobile = useMemo(() => !!(windowWidth && windowWidth < 1260), [windowWidth])

  const isOpen = useMemo(
    () => (redesignFlag === RedesignVariant.Enabled || walletFlag === WalletVariant.Enabled) && walletDropdownOpen,
    [redesignFlag, walletFlag, walletDropdownOpen]
  )

  return (
    <>
      {isOpen && (
        <WalletDropdownWrapper isMobile={isMobile}>
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
