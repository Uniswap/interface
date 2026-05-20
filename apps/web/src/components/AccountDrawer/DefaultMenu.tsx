import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import { TransitionItem } from 'ui/src/animations'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { LanguageMenu } from '~/components/AccountDrawer/LanguageMenu'
import { LocalCurrencyMenu } from '~/components/AccountDrawer/LocalCurrencyMenu'
import { MainMenu } from '~/components/AccountDrawer/MainMenu/MainMenu'
import { MenuStateVariant, useMenuState, useSetMenuCallback } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { PasskeyMenu } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { PortfolioBalanceMenu } from '~/components/AccountDrawer/PortfolioBalanceMenu'
import { RecoveryPhraseDownloadPrompt } from '~/components/AccountDrawer/RecoveryPhraseMenu/RecoveryPhraseDownloadPrompt'
import { RecoveryPhraseMenu } from '~/components/AccountDrawer/RecoveryPhraseMenu/RecoveryPhraseMenu'
import { SettingsMenu } from '~/components/AccountDrawer/SettingsMenu'
import { StorageMenu } from '~/components/AccountDrawer/StorageMenu'
import { OtherWalletsModal } from '~/components/WalletModal/OtherWalletsModal'
import { SwitchWalletModal } from '~/components/WalletModal/SwitchWalletModal'
import { usePrevious } from '~/hooks/usePrevious'

export function DefaultMenu() {
  const { menuState } = useMenuState()
  const openSettings = useSetMenuCallback(MenuStateVariant.SETTINGS)
  const returnToMain = useSetMenuCallback(MenuStateVariant.MAIN)
  const openLanguageSettings = useSetMenuCallback(MenuStateVariant.LANGUAGE_SETTINGS)
  const openLocalCurrencySettings = useSetMenuCallback(MenuStateVariant.LOCAL_CURRENCY_SETTINGS)
  const openPortfolioBalanceSettings = useSetMenuCallback(MenuStateVariant.PORTFOLIO_BALANCE_SETTINGS)
  const openPasskeySettings = useSetMenuCallback(MenuStateVariant.PASSKEYS)
  const openRecoveryPhraseDownloadPrompt = useSetMenuCallback(MenuStateVariant.RECOVERY_PHRASE_DOWNLOAD_PROMPT)
  const openRecoveryPhraseWarning = useSetMenuCallback(MenuStateVariant.RECOVERY_PHRASE)
  const openStorageSettings = useSetMenuCallback(MenuStateVariant.STORAGE_SETTINGS)

  const { isOpen: drawerOpen } = useAccountDrawer()

  const prevMenuVariant = usePrevious(menuState.variant)

  const animationDirection = useMemo(() => {
    const menuIndices: Partial<Record<MenuStateVariant, number>> = {
      [MenuStateVariant.MAIN]: 0,
      [MenuStateVariant.SWITCH]: 1,
      [MenuStateVariant.CONNECT_PLATFORM]: 1,
      [MenuStateVariant.SETTINGS]: 2,
      [MenuStateVariant.OTHER_WALLETS]: 1,
      [MenuStateVariant.LANGUAGE_SETTINGS]: 2,
      [MenuStateVariant.LOCAL_CURRENCY_SETTINGS]: 2,
      [MenuStateVariant.PORTFOLIO_BALANCE_SETTINGS]: 2,
      [MenuStateVariant.PASSKEYS]: 2,
      [MenuStateVariant.RECOVERY_PHRASE_DOWNLOAD_PROMPT]: 2,
      [MenuStateVariant.RECOVERY_PHRASE]: 3,
      [MenuStateVariant.STORAGE_SETTINGS]: 3,
    }

    if (!prevMenuVariant || prevMenuVariant === menuState.variant) {
      return 'forward'
    }

    const newIndex = menuIndices[menuState.variant] ?? 2
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
            openRecoveryPhraseSettings={openRecoveryPhraseDownloadPrompt}
            openPortfolioBalanceSettings={openPortfolioBalanceSettings}
            openStorageSettings={openStorageSettings}
          />
        )
      case MenuStateVariant.LANGUAGE_SETTINGS:
        return <LanguageMenu onClose={openSettings} />
      case MenuStateVariant.PORTFOLIO_BALANCE_SETTINGS:
        return <PortfolioBalanceMenu onClose={openSettings} />
      case MenuStateVariant.LOCAL_CURRENCY_SETTINGS:
        return <LocalCurrencyMenu onClose={openSettings} />
      case MenuStateVariant.STORAGE_SETTINGS:
        return <StorageMenu onClose={openSettings} />
      case MenuStateVariant.PASSKEYS:
        return <PasskeyMenu onClose={openSettings} />
      case MenuStateVariant.RECOVERY_PHRASE_DOWNLOAD_PROMPT:
        return <RecoveryPhraseDownloadPrompt onBack={openSettings} onContinueOnWeb={openRecoveryPhraseWarning} />
      case MenuStateVariant.RECOVERY_PHRASE:
        return <RecoveryPhraseMenu onClose={openSettings} />
      default:
        return null
    }
  }, [
    menuState,
    openLanguageSettings,
    openLocalCurrencySettings,
    openPortfolioBalanceSettings,
    openPasskeySettings,
    openRecoveryPhraseDownloadPrompt,
    openRecoveryPhraseWarning,
    openStorageSettings,
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
