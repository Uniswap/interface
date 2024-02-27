import { useWeb3React } from '@web3-react/core'
import { LimitsMenu } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitsMenu'
import Column from 'components/Column'
import WalletModal from 'components/WalletModal'
import { useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'

import { sendAnalyticsEvent } from 'analytics'
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
  DEFAULT = 'default',
  SETTINGS = 'settings',
  LANGUAGE_SETTINGS = 'language_settings',
  LOCAL_CURRENCY_SETTINGS = 'local_currency_settings',
  LIMITS = 'limits',
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

  useEffect(() => {
    if (menu === MenuState.DEFAULT) return // menu is closed, don't log

    sendAnalyticsEvent('Portfolio Menu Opened', { name: menu })
  }, [menu])

  const SubMenu = useMemo(() => {
    switch (menu) {
      case MenuState.DEFAULT:
        return isAuthenticated ? (
          <AuthenticatedHeader account={account} openSettings={openSettings} />
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
    openLocalCurrencySettings,
    openSettings,
  ])

  return <DefaultMenuWrap>{SubMenu}</DefaultMenuWrap>
}

export default DefaultMenu
