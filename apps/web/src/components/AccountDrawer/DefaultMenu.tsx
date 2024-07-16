import AuthenticatedHeader from 'components/AccountDrawer/AuthenticatedHeader'
import LanguageMenu from 'components/AccountDrawer/LanguageMenu'
import LocalCurrencyMenu from 'components/AccountDrawer/LocalCurrencyMenu'
import { LimitsMenu } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitsMenu'
import SettingsMenu from 'components/AccountDrawer/SettingsMenu'
import Column from 'components/Column'
import WalletModal from 'components/WalletModal'
import { useAccount } from 'hooks/useAccount'
import { atom, useAtom } from 'jotai'
import { useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

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
  const account = useAccount()

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
    if (menu === MenuState.DEFAULT) {
      return
    } // menu is closed, don't log

    sendAnalyticsEvent(InterfaceEventNameLocal.PortfolioMenuOpened, { name: menu })
  }, [menu])

  const SubMenu = useMemo(() => {
    switch (menu) {
      case MenuState.DEFAULT:
        return account.address ? (
          <AuthenticatedHeader account={account.address} openSettings={openSettings} />
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
        return account.address ? <LimitsMenu onClose={closeLimitsMenu} account={account.address} /> : null
    }
  }, [
    account.address,
    closeLimitsMenu,
    closeSettings,
    menu,
    openLanguageSettings,
    openLocalCurrencySettings,
    openSettings,
  ])

  return <DefaultMenuWrap>{SubMenu}</DefaultMenuWrap>
}

export default DefaultMenu
