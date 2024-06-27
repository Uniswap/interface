import Column from 'components/Column'
import styled from 'styled-components'

export enum Views {
  SETTINGS = 'Settings',
  LANGUAGE = 'Language',
  CURRENCY = 'Currency',
}

export const SettingsColumn = styled(Column)`
  width: 100%;
  overflow: auto;
`
