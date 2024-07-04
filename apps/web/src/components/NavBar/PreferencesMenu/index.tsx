import { AnimatedSlider } from 'components/AnimatedSlider'
import { NavDropdown, NavDropdownDefaultWrapper } from 'components/NavBar/NavDropdown/index'
import { NavIcon } from 'components/NavBar/NavIcon'
import { CurrencySettings } from 'components/NavBar/PreferencesMenu/Currency'
import { LanguageSettings } from 'components/NavBar/PreferencesMenu/Language'
import { PreferenceSettings } from 'components/NavBar/PreferencesMenu/Preferences'
import { PreferencesView } from 'components/NavBar/PreferencesMenu/shared'
import { useCallback, useState } from 'react'
import { Popover } from 'ui/src'
import { Global } from 'ui/src/components/icons'

export function getSettingsViewIndex(view: PreferencesView) {
  if (view === PreferencesView.SETTINGS) {
    return 0
  } else if (view === PreferencesView.LANGUAGE) {
    return 1
  } else {
    return 2
  }
}

export function PreferenceMenu() {
  const [settingsView, setSettingsView] = useState<PreferencesView>(PreferencesView.SETTINGS)
  const [isOpen, setIsOpen] = useState(false)
  const handleExitMenu = useCallback(() => setSettingsView(PreferencesView.SETTINGS), [setSettingsView])
  const onOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        handleExitMenu()
      }
    },
    [handleExitMenu, setIsOpen],
  )

  return (
    <Popover placement="bottom" stayInFrame allowFlip onOpenChange={onOpenChange}>
      <Popover.Trigger>
        <NavIcon isActive={isOpen}>
          <Global size={20} color="$neutral2" cursor="pointer" />
        </NavIcon>
      </Popover.Trigger>
      <NavDropdown width={310} isOpen={isOpen}>
        <NavDropdownDefaultWrapper>
          <AnimatedSlider
            currentIndex={getSettingsViewIndex(settingsView)}
            slideDirection={settingsView === PreferencesView.SETTINGS ? 'forward' : 'backward'}
          >
            <PreferenceSettings setSettingsView={(view: PreferencesView) => setSettingsView(view)} />
            <LanguageSettings onExitMenu={handleExitMenu} />
            <CurrencySettings onExitMenu={handleExitMenu} />
          </AnimatedSlider>
        </NavDropdownDefaultWrapper>
      </NavDropdown>
    </Popover>
  )
}
