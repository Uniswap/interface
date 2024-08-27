import { Flex, styled } from 'ui/src'

export enum PreferencesView {
  SETTINGS = 'Settings',
  LANGUAGE = 'Language',
  CURRENCY = 'Currency',
}

export const SettingsColumn = styled(Flex, {
  width: '100%',
})
