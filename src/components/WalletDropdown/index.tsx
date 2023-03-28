import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceEventName } from '@uniswap/analytics-events'
import { ScrollBarStyles } from 'components/Common'
import { useWindowSize } from 'hooks/useWindowSize'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect, useRef } from 'react'
import { ChevronsRight } from 'react-feather'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ClickableStyle } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import DefaultMenu from './DefaultMenu'

const DRAWER_WIDTH_XL = '390px'
const DRAWER_WIDTH = '320px'
const DRAWER_MARGIN = '8px'
const DRAWER_OFFSET = '10px'
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

const WalletDropdownScrollWrapper = styled.div`
  overflow: hidden;
  &:hover {
    overflow-y: auto;
  }

  ${ScrollBarStyles}

  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  border-radius: 12px;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 2 * ${DRAWER_MARGIN});
  overflow: hidden;
  position: fixed;
  right: ${DRAWER_MARGIN};
  top: ${DRAWER_MARGIN};
  z-index: ${Z_INDEX.fixed};
`

const WalletDropdownWrapper = styled.div<{ open: boolean }>`
  margin-right: ${({ open }) => (open ? 0 : '-' + DRAWER_WIDTH)};
  height: 100%;
  overflow: hidden;

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

  @media screen and (min-width: 1440px) {
    margin-right: ${({ open }) => (open ? 0 : '-' + DRAWER_WIDTH_XL)};
    width: ${DRAWER_WIDTH_XL};
  }

  border-radius: 12px;
  width: ${DRAWER_WIDTH};
  font-size: 16px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};

  box-shadow: ${({ theme }) => theme.deepShadow};
  transition: margin-right ${({ theme }) => theme.transition.duration.medium},
    bottom ${({ theme }) => theme.transition.duration.medium};
`

const CloseIcon = styled(ChevronsRight).attrs({ size: 24 })`
  stroke: ${({ theme }) => theme.textSecondary};
`

const CloseDrawer = styled.div`
  ${ClickableStyle}
  cursor: pointer;
  height: 100%;
  // When the drawer is not hovered, the icon should be 18px from the edge of the sidebar.
  padding: 24px calc(18px + ${DRAWER_OFFSET}) 24px 14px;
  border-radius: 20px 0 0 20px;
  transition: ${({ theme }) =>
    `${theme.transition.duration.medium} ${theme.transition.timing.ease} background-color, ${theme.transition.duration.medium} ${theme.transition.timing.ease} margin`};
  &:hover {
    margin: 0 -4px 0 0;
    background-color: ${({ theme }) => theme.stateOverlayHover};
  }
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

function WalletDropdown() {
  const [walletDrawerOpen, toggleWalletDrawer] = useWalletDrawer()
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!walletDrawerOpen) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [walletDrawerOpen])

  // close on escape keypress
  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && walletDrawerOpen) {
        event.preventDefault()
        toggleWalletDrawer()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [walletDrawerOpen, toggleWalletDrawer])

  // close on escape keypress
  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && walletDrawerOpen) {
        event.preventDefault()
        toggleWalletDrawer()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [walletDrawerOpen, toggleWalletDrawer])

  return (
    <Wrapper>
      {walletDrawerOpen && (
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={InterfaceEventName.MINI_PORTFOLIO_TOGGLED}
          properties={{ type: 'close' }}
        >
          <CloseDrawer onClick={toggleWalletDrawer}>
            <CloseIcon />
          </CloseDrawer>
        </TraceEvent>
      )}
      <Scrim onClick={toggleWalletDrawer} open={walletDrawerOpen} />
      <WalletDropdownWrapper open={walletDrawerOpen}>
        {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
        <WalletDropdownScrollWrapper ref={scrollRef} id="wallet-dropdown-scroll-wrapper">
          <DefaultMenu />
        </WalletDropdownScrollWrapper>
      </WalletDropdownWrapper>
    </Wrapper>
  )
}

export default WalletDropdown
