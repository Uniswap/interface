import { useWeb3React } from '@web3-react/core'
import { LimitsMenu } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitsMenu'
import Column from 'components/Column'
import WalletModal from 'components/WalletModal'
import { useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'

import { atom, useAtom } from 'jotai'
import AuthenticatedHeader from './AuthenticatedHeader'
import LanguageMenu from './LanguageMenu'
import LocalCurrencyMenu from './LocalCurrencyMenu'
import SettingsMenu from './SettingsMenu'

const DefaultMenuWrap = styled(Column)`
  width: 100%;
  height: 100%;
`

export enum MenuState {
  DEFAULT,
  SETTINGS,
  LANGUAGE_SETTINGS,
  LOCAL_CURRENCY_SETTINGS,
  LIMITS,
}

export const miniPortfolioMenuStateAtom = atom(MenuState.DEFAULT)

function DefaultMenu({ drawerOpen }: { drawerOpen: boolean }) {
  const { account } = useWeb3React()
  const isAuthenticated = !!account

  const [menu, setMenu] = useAtom(miniPortfolioMenuStateAtom)
  const openSettings = useCallback(() => setMenu(MenuState.SETTINGS), [setMenu])
  const closeSettings = useCallback(() => setMenu(MenuState.DEFAULT), [setMenu])
  const openLanguageSettings = useCallback(() => setMenu(MenuState.LANGUAGE_SETTINGS), [setMenu])
  const openLocalCurrencySettings = useCallback(() => setMenu(MenuState.LOCAL_CURRENCY_SETTINGS), [setMenu])
  const openLimitsMenu = useCallback(() => setMenu(MenuState.LIMITS), [setMenu])
  const closeLimitsMenu = useCallback(() => setMenu(MenuState.DEFAULT), [setMenu])

  useEffect(() => {
    if (!drawerOpen && menu !== MenuState.DEFAULT) {
      // wait for the drawer to close before resetting the menu
      const timer = setTimeout(() => {
        closeSettings()
      }, 250)
      return () => clearTimeout(timer)
    }
    return
  }, [drawerOpen, menu, closeSettings])

  const SubMenu = useMemo(() => {
    switch (menu) {
      case MenuState.DEFAULT:
        return isAuthenticated ? (
          <AuthenticatedHeader account={account} openSettings={openSettings} openLimitsMenu={openLimitsMenu} />
        ) : (
          <WalletModal openSettings={openSettings} />
        )
      case MenuState.SETTINGS:
        return (
          <SettingsMenu
            onClose={closeSettings}
            openLanguageSettings={openLanguageSettings}
            openLocalCurrencySettings={openLocalCurrencySettings}
          />
        )
      case MenuState.LANGUAGE_SETTINGS:
        return <LanguageMenu onClose={openSettings} />
      case MenuState.LOCAL_CURRENCY_SETTINGS:
        return <LocalCurrencyMenu onClose={openSettings} />
      case MenuState.LIMITS:
        return isAuthenticated ? <LimitsMenu onClose={closeLimitsMenu} account={account} /> : null
    }
  }, [
    account,
    closeLimitsMenu,
    closeSettings,
    isAuthenticated,
    menu,
    openLanguageSettings,
    openLimitsMenu,
    openLocalCurrencySettings,
    openSettings,
  ])

  return <DefaultMenuWrap>{SubMenu}</DefaultMenuWrap>
}

export default DefaultMenu
