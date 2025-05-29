import Column from 'components/deprecated/Column'
import styled from 'lib/styled-components'
import { breakpoints } from 'ui/src/theme'

export const NavDropdownDefaultWrapper = styled(Column)`
  width: 100%;
  align-items: center;
  gap: 2px;
  @media screen and (max-width: ${breakpoints.sm}px) {
    width: 100%;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
    border-bottom: none;
  }
  max-height: inherit;
  overflow-y: auto;
`
export const NavDropdownTabWrapper = styled(Column)`
  min-width: 180px;
  padding: 4px;
  gap: 4px;
  position: relative;
`
