import { NAV_BREAKPOINT } from 'components/NavBar/ScreenSizes'
import styled, { css } from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

const MobileBottomBarBase = css`
  z-index: ${Z_INDEX.dropdown};
  position: fixed;
  display: flex;
  bottom: 0;
  right: 0;
  left: 0;
  justify-content: space-between;

  @media screen and (min-width: ${NAV_BREAKPOINT.showMobileBar}px) {
    display: none;
  }
`

export const MobileBottomBarLegacy = styled.div`
  ${MobileBottomBarBase}
  width: calc(100vw - 16px);
  height: 48px;
  margin: 8px;
  padding: 0px 4px;
  background: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
`
