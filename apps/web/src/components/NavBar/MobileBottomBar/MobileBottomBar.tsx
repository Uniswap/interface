import { NAV_BREAKPOINT } from 'components/NavBar/ScreenSizes'
import styled, { css } from 'lib/styled-components'
import { Z_INDEX } from 'theme/zIndex'

const MOBILE_BAR_MAX_HEIGHT = 100 // ensure that it's translated out of view on scroll

const MobileBottomBarBase = css`
  z-index: ${Z_INDEX.dropdown};
  position: fixed;
  display: flex;
  bottom: 0;
  right: 0;
  left: 0;
  justify-content: space-between;
  gap: 8px;
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

export const MobileBottomBar = styled.div<{ $hide: boolean }>`
  ${MobileBottomBarBase}
  width: 100%;
  max-height: ${MOBILE_BAR_MAX_HEIGHT}px;
  backdrop-filter: blur(4px);
  mask: linear-gradient(to bottom, transparent, ${({ theme }) => theme.surface1} 15%);
  padding: 12px 16px;
  transition: bottom ${({ theme }) => theme.transition.duration.slow};
  ${({ $hide }) => $hide && `bottom: -${MOBILE_BAR_MAX_HEIGHT}px !important`};
  @media screen and (min-width: ${NAV_BREAKPOINT.showMobileBar}px) {
    display: none;
  }
`
