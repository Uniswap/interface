import { NavDropdown, NavDropdownDefaultWrapper } from 'components/NavBar/NavDropdown/index'
import { CurrencySettings } from 'components/NavBar/PreferencesMenu/Currency'
import { LanguageSettings } from 'components/NavBar/PreferencesMenu/Language'
import { PreferenceSettings } from 'components/NavBar/PreferencesMenu/Preferences'
import { Views } from 'components/NavBar/PreferencesMenu/shared'
import { useCallback, useState } from 'react'
import { Popover } from 'ui/src'
import { Global } from 'ui/src/components/icons'

export function PreferenceMenu() {
  const [settingsView, setSettingsView] = useState<Views>(Views.SETTINGS)
  const onExitMenu = useCallback(() => setSettingsView(Views.SETTINGS), [setSettingsView])

  return (
    <Popover placement="bottom" stayInFrame allowFlip onOpenChange={onExitMenu}>
      <Popover.Trigger padding={8}>
        <Global size={20} color="$neutral2" cursor="pointer" />
      </Popover.Trigger>
      <NavDropdown width={310}>
        <NavDropdownDefaultWrapper>
          {settingsView === Views.SETTINGS && (
            <PreferenceSettings setSettingsView={(view: Views) => setSettingsView(view)} />
          )}
          {settingsView === Views.LANGUAGE && <LanguageSettings onExitMenu={onExitMenu} />}
          {settingsView === Views.CURRENCY && <CurrencySettings onExitMenu={onExitMenu} />}
        </NavDropdownDefaultWrapper>
      </NavDropdown>
    </Popover>
  )
}
