import Column from 'components/Column'
import styled from 'lib/styled-components'

export enum PreferencesView {
  SETTINGS = 'Settings',
  LANGUAGE = 'Language',
  CURRENCY = 'Currency',
}

export const SettingsColumn = styled(Column)`
  width: 100%;
  overflow: auto;
`
