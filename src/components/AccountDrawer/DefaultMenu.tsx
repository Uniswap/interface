import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import WalletModal from 'components/WalletModal'
import { useCallback, useState } from 'react'
import styled from 'styled-components/macro'

import AuthenticatedHeader from './AuthenticatedHeader'
import SettingsMenu from './SettingsMenu'

const DefaultMenuWrap = styled(Column)`
  width: 100%;
  height: 100%;
`

enum MenuState {
  DEFAULT,
  SETTINGS,
}

function DefaultMenu() {
  const { account } = useWeb3React()
  const isAuthenticated = !!account

  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const openSettings = useCallback(() => setMenu(MenuState.SETTINGS), [])
  const closeSettings = useCallback(() => setMenu(MenuState.DEFAULT), [])

  return (
    <DefaultMenuWrap>
      {menu === MenuState.DEFAULT &&
        (isAuthenticated ? (
          <AuthenticatedHeader account={account} openSettings={openSettings} />
        ) : (
          <WalletModal openSettings={openSettings} />
        ))}
      {menu === MenuState.SETTINGS && <SettingsMenu onClose={closeSettings} />}
    </DefaultMenuWrap>
  )
}

export default DefaultMenu
