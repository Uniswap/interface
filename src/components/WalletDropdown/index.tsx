import { useWeb3React } from '@web3-react/core'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { opacify } from 'theme/utils'

import DefaultMenu from './DefaultMenu'
import { LanguageMenu } from './LanguageMenu'
import { TransactionHistoryMenu } from './TransactionMenu'

const WalletWrapper = styled.div<{ height: string }>`
  border-radius: 12px;
  width: 320px;
  height: ${(props) => props.height};
  display: flex;
  flex-direction: column;
  font-size: 16px;
  top: 60px;
  right: 70px;
  background-color: ${({ theme }) => opacify(95, theme.backgroundSurface)};
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
  const isAuthenticated = !!account
  const height = isAuthenticated ? '324px' : '200px'

  return (
    <WalletWrapper height={height}>
      {menu === MenuState.TRANSACTIONS && <TransactionHistoryMenu close={() => setMenu(MenuState.DEFAULT)} />}
      {menu === MenuState.LANGUAGE && <LanguageMenu close={() => setMenu(MenuState.DEFAULT)} />}
      {menu === MenuState.DEFAULT && <DefaultMenu setMenu={setMenu} />}
    </WalletWrapper>
  )
}

export default WalletDropdown
