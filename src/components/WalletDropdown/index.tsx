import { ScrollBarStyles } from 'components/Common'
import { useWindowSize } from 'hooks/useWindowSize'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect } from 'react'
import { ChevronsRight } from 'react-feather'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ClickableStyle } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import DefaultMenu from './DefaultMenu'

const DRAWER_WIDTH = '320px'
const DRAWER_MARGIN = '8px'
const DRAWER_TOP_MARGIN_MOBILE_WEB = '72px'

const walletDrawerOpenAtom = atom(false)

export function useToggleWalletDrawer() {
  const updateWalletDrawerOpen = useUpdateAtom(walletDrawerOpenAtom)
  return useCallback(() => {
    updateWalletDrawerOpen((open) => !open)
  }, [updateWalletDrawerOpen])
}

export function useWalletDrawer(): [boolean, () => void] {
  const walletDrawerOpen = useAtomValue(walletDrawerOpenAtom)
  return [walletDrawerOpen, useToggleWalletDrawer()]
}

const ScrimBackground = styled.div<{ open: boolean }>`
  z-index: ${Z_INDEX.modalBackdrop};
  overflow: hidden;
  top: 0;
  left: 0;
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.backgroundScrim};

  opacity: 0;
  pointer-events: none;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    opacity: ${({ open }) => (open ? 1 : 0)};
    pointer-events: ${({ open }) => (open ? 'auto' : 'none')};
    transition: opacity ${({ theme }) => theme.transition.duration.medium} ease-in-out;
  }
`
const Scrim = ({ onClick, open }: { onClick: () => void; open: boolean }) => {
  const { width } = useWindowSize()

  useEffect(() => {
    if (width && width < BREAKPOINTS.sm && open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'visible'
    }
  }, [open, width])

  return <ScrimBackground onClick={onClick} open={open} />
}

const WalletDropdownWrapper = styled.div<{ open: boolean }>`
  position: fixed;
  top: ${DRAWER_MARGIN};
  right: ${({ open }) => (open ? DRAWER_MARGIN : '-' + DRAWER_WIDTH)};
  z-index: ${Z_INDEX.dropdown};

  overflow-y: overlay;
  ${ScrollBarStyles}

  height: calc(100% - 2 * ${DRAWER_MARGIN});

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    z-index: ${Z_INDEX.modal};
    top: unset;
    left: 0;
    right: 0;
    bottom: ${({ open }) => (open ? 0 : `calc(-1 * (100% - ${DRAWER_TOP_MARGIN_MOBILE_WEB}))`)};

    width: 100%;
    height: calc(100% - ${DRAWER_TOP_MARGIN_MOBILE_WEB});
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
    box-shadow: unset;
  }

  ::-webkit-scrollbar-track {
    margin-top: 40px;
    margin-bottom: 40px;
  }

  border-radius: 12px;
  width: ${DRAWER_WIDTH};
  font-size: 16px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  padding: 14px 16px 16px;

  box-shadow: ${({ theme }) => theme.deepShadow};
  transition: right ${({ theme }) => theme.transition.duration.medium},
    bottom ${({ theme }) => theme.transition.duration.medium};
`

const CLOSE_ICON_OFFSET = '16px'
const CloseDrawer = styled(ChevronsRight).attrs({ size: 24 })`
  ${ClickableStyle}
  position: fixed;
  top: 24px;
  right: calc(${DRAWER_MARGIN} + ${DRAWER_WIDTH} + ${CLOSE_ICON_OFFSET});
  z-index: ${Z_INDEX.dropdown};
  stroke: ${({ theme }) => theme.textSecondary};
  cursor: pointer;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

function WalletDropdown() {
  const [walletDrawerOpen, toggleWalletDrawer] = useWalletDrawer()

  return (
    <>
      {walletDrawerOpen && <CloseDrawer onClick={toggleWalletDrawer} />}
      <Scrim onClick={toggleWalletDrawer} open={walletDrawerOpen} />
      {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
      <WalletDropdownWrapper open={walletDrawerOpen} id="wallet-dropdown-wrapper">
        <DefaultMenu />
      </WalletDropdownWrapper>
    </>
  )
}

export default WalletDropdown
