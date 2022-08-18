import { useWeb3React } from '@web3-react/core'
import { useState } from 'react'
import styled from 'styled-components/macro'

import { useUserHasAvailableClaim } from '../../state/claim/hooks'
import DefaultMenu from './DefaultMenu'
import LanguageMenu from './LanguageMenu'
import { TransactionHistoryMenu } from './TransactionMenu'

const WalletWrapper = styled.div<{ isAuthenticated: boolean; hasUnclaimed: boolean }>`
  border-radius: 12px;
  width: 320px;
  max-height: 376px;
  max-height: 388px;
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

const WalletDropdown = () => {
  const { account } = useWeb3React()
  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const hasUnclaimed = useUserHasAvailableClaim(account)

  return (
    <WalletWrapper isAuthenticated={!!account} hasUnclaimed={hasUnclaimed}>
      {menu === MenuState.TRANSACTIONS && <TransactionHistoryMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
      {menu === MenuState.LANGUAGE && <LanguageMenu onClose={() => setMenu(MenuState.DEFAULT)} />}
      {menu === MenuState.DEFAULT && <DefaultMenu setMenu={setMenu} />}
    </WalletWrapper>
  )
}

export default WalletDropdown
