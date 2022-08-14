import { useState } from 'react'
import styled from 'styled-components/macro'
import { useWeb3React } from '@web3-react/core'
import { themeVars } from 'nft/css/sprinkles.css'

import { LanguageMenu } from './LanguageMenu'
// import { TransactionHistoryMenu } from './TransactionHistoryMenu'
import DefaultMenu from './DefaultMenu'

const WalletWrapper = styled.div<{ height: string }>`
  position: absolute;
  border-radius: 12px;
  width: 320px;
  height: ${(props) => props.height};
  display: flex;
  flex-direction: column;
  font-size: 16px;
  top: 60px;
  right: 70px;
  background-color: ${themeVars.colors.white95};
  padding-top: 16px;
  padding-bottom: 16px;
`

const WalletDropdown = () => {
  const { account } = useWeb3React()
  const isAuthenticated = !!account
  const [menu, setMenu] = useState<'DEFAULT' | 'LANGUAGE' | 'TRANSACTIONS'>('DEFAULT')

  const height = isAuthenticated ? '324px' : '200px'

  return (
    <WalletWrapper height={height}>
      {/* {menu === 'TRANSACTIONS' && <TransactionHistoryMenu close={() => setMenu('DEFAULT')} />} */}
      {menu === 'LANGUAGE' && <LanguageMenu close={() => setMenu('DEFAULT')} />}
      {menu === 'DEFAULT' && <DefaultMenu setMenu={setMenu} />}
    </WalletWrapper>
  )
}

export default WalletDropdown
