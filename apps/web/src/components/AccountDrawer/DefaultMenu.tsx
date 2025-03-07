import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer'
import AuthenticatedHeader from 'components/AccountDrawer/AuthenticatedHeader'
import LanguageMenu from 'components/AccountDrawer/LanguageMenu'
import LocalCurrencyMenu from 'components/AccountDrawer/LocalCurrencyMenu'
import { LimitsMenu } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitsMenu'
import { UniExtensionPoolsMenu } from 'components/AccountDrawer/MiniPortfolio/Pools/UniExtensionPoolsMenu'
import SettingsMenu from 'components/AccountDrawer/SettingsMenu'
import Column from 'components/deprecated/Column'
import WalletModal from 'components/WalletModal'
import { useAccount } from 'hooks/useAccount'
import { useAtom } from 'jotai'
import styled from 'lib/styled-components'
import { useCallback, useEffect, useMemo } from 'react'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

const DefaultMenuWrap = styled(Column)`
  width: 100%;
  height: 100%;
`

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
    return undefined
  }, [drawerOpen, menu, closeSettings])

  useEffect(() => {
    if (menu === MenuState.DEFAULT) {
      return
    } // menu is closed, don't log

    sendAnalyticsEvent(InterfaceEventNameLocal.PortfolioMenuOpened, { name: menu })
  }, [menu])

  // eslint-disable-next-line consistent-return
  const SubMenu = useMemo(() => {
    switch (menu) {
      case MenuState.DEFAULT:
        return account.address ? (
          <AuthenticatedHeader account={account.address} openSettings={openSettings} />
        ) : (
          <WalletModal />
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
      case MenuState.POOLS:
        return account.address ? <UniExtensionPoolsMenu account={account.address} onClose={closeLimitsMenu} /> : null
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
