import Column from 'components/Column'
import { NAV_BREAKPOINT } from 'components/NavBar/ScreenSizes'
import styled from 'lib/styled-components'

export const NavDropdownDefaultWrapper = styled(Column)`
  width: 100%;
  padding: 12px 16px;
  align-items: center;
  gap: 2px;
  @media screen and (max-width: ${NAV_BREAKPOINT.isMobileDrawer}px) {
    width: 100%;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
    border-bottom: none;
  }
`
export const NavDropdownTabWrapper = styled(Column)`
  min-width: 180px;
  padding: 4px;
  gap: 4px;
  position: relative;
`
