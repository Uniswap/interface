import LanguageMenu from 'components/AccountDrawer/LanguageMenu'
import LocalCurrencyMenu from 'components/AccountDrawer/LocalCurrencyMenu'
import { MainMenu } from 'components/AccountDrawer/MainMenu/MainMenu'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LimitsMenu } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitsMenu'
import { UniExtensionPoolsMenu } from 'components/AccountDrawer/MiniPortfolio/Pools/UniExtensionPoolsMenu'
import { MenuStateVariant, useMenuState, useSetMenuCallback } from 'components/AccountDrawer/menuState'
import PasskeyMenu from 'components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import PortfolioBalanceMenu from 'components/AccountDrawer/PortfolioBalanceMenu'
import SettingsMenu from 'components/AccountDrawer/SettingsMenu'
import { OtherWalletsModal } from 'components/WalletModal/OtherWalletsModal'
import { SwitchWalletModal } from 'components/WalletModal/SwitchWalletModal'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import { TransitionItem } from 'ui/src/animations'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

function DefaultMenu() {
  const activeAccount = useActiveAddresses()

  const { menuState } = useMenuState()
  const openSettings = useSetMenuCallback(MenuStateVariant.SETTINGS)
  const returnToMain = useSetMenuCallback(MenuStateVariant.MAIN)
  const openLanguageSettings = useSetMenuCallback(MenuStateVariant.LANGUAGE_SETTINGS)
  const openLocalCurrencySettings = useSetMenuCallback(MenuStateVariant.LOCAL_CURRENCY_SETTINGS)
  const openPortfolioBalanceSettings = useSetMenuCallback(MenuStateVariant.PORTFOLIO_BALANCE_SETTINGS)
  const openPasskeySettings = useSetMenuCallback(MenuStateVariant.PASSKEYS)

  const { isOpen: drawerOpen } = useAccountDrawer()

  const prevMenuVariant = usePrevious(menuState.variant)

  const animationDirection = useMemo(() => {
    const menuIndices = {
      [MenuStateVariant.MAIN]: 0,
      [MenuStateVariant.SWITCH]: 1,
      [MenuStateVariant.CONNECT_PLATFORM]: 1,
      [MenuStateVariant.SETTINGS]: 2,
      [MenuStateVariant.POOLS]: 1,
      [MenuStateVariant.OTHER_WALLETS]: 1,
      [MenuStateVariant.LANGUAGE_SETTINGS]: 2,
      [MenuStateVariant.LOCAL_CURRENCY_SETTINGS]: 2,
      [MenuStateVariant.PORTFOLIO_BALANCE_SETTINGS]: 2,
      [MenuStateVariant.LIMITS]: 2,
      [MenuStateVariant.PASSKEYS]: 2,
    } as const

    if (!prevMenuVariant || prevMenuVariant === menuState.variant) {
      return 'forward'
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const newIndex = menuIndices[menuState.variant] ?? 2
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const oldIndex = menuIndices[prevMenuVariant] ?? 2
    return newIndex > oldIndex ? 'forward' : 'backward'
  }, [menuState.variant, prevMenuVariant])

  useEffect(() => {
    if (!drawerOpen && menuState.variant !== MenuStateVariant.MAIN) {
      // wait for the drawer to close before resetting the menu
      const timer = setTimeout(() => {
        returnToMain()
      }, 250)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [drawerOpen, menuState.variant, returnToMain])

  useEffect(() => {
    if (menuState.variant === MenuStateVariant.MAIN) {
      return
    } // menu is closed, don't log

    sendAnalyticsEvent(
      InterfaceEventName.PortfolioMenuOpened,
      menuState.variant === MenuStateVariant.CONNECT_PLATFORM
        ? { name: menuState.variant, platform: menuState.platform }
        : { name: menuState.variant },
    )
  }, [menuState])

  // eslint-disable-next-line consistent-return
  const SubMenu = useMemo(() => {
    switch (menuState.variant) {
      case MenuStateVariant.MAIN:
        return <MainMenu />
      case MenuStateVariant.SWITCH:
        return <SwitchWalletModal connectOnPlatform="any" onClose={returnToMain} />
      case MenuStateVariant.CONNECT_PLATFORM:
        return <SwitchWalletModal connectOnPlatform={menuState.platform} onClose={returnToMain} />
      case MenuStateVariant.OTHER_WALLETS:
        return <OtherWalletsModal />
      case MenuStateVariant.SETTINGS:
        return (
          <SettingsMenu
            onClose={returnToMain}
            openLanguageSettings={openLanguageSettings}
            openLocalCurrencySettings={openLocalCurrencySettings}
            openPasskeySettings={openPasskeySettings}
            openPortfolioBalanceSettings={openPortfolioBalanceSettings}
          />
        )

      case MenuStateVariant.LANGUAGE_SETTINGS:
        return <LanguageMenu onClose={openSettings} />
      case MenuStateVariant.PORTFOLIO_BALANCE_SETTINGS:
        return <PortfolioBalanceMenu onClose={openSettings} />
      case MenuStateVariant.LOCAL_CURRENCY_SETTINGS:
        return <LocalCurrencyMenu onClose={openSettings} />
      case MenuStateVariant.LIMITS:
        return activeAccount.evmAddress ? (
          <LimitsMenu onClose={returnToMain} account={activeAccount.evmAddress} />
        ) : null
      case MenuStateVariant.POOLS:
        return activeAccount.evmAddress ? (
          <UniExtensionPoolsMenu account={activeAccount.evmAddress} onClose={returnToMain} />
        ) : null
      case MenuStateVariant.PASSKEYS:
        return <PasskeyMenu onClose={openSettings} />
    }
  }, [
    activeAccount.evmAddress,
    menuState,
    openLanguageSettings,
    openLocalCurrencySettings,
    openPortfolioBalanceSettings,
    openPasskeySettings,
    openSettings,
    returnToMain,
  ])

  return (
    <Flex width="100%" height="100%">
      <TransitionItem animationType={animationDirection} animation="100ms" childKey={menuState.variant}>
        {SubMenu}
      </TransitionItem>
    </Flex>
  )
}

export default DefaultMenu
