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

const accountDrawerOpenAtom = atom(false)

export function useToggleAccountDrawer() {
  const updateAccountDrawerOpen = useUpdateAtom(accountDrawerOpenAtom)
  return useCallback(() => {
    updateAccountDrawerOpen((open) => !open)
  }, [updateAccountDrawerOpen])
}

export function useAccountDrawer(): [boolean, () => void] {
  const accountDrawerOpen = useAtomValue(accountDrawerOpenAtom)
  return [accountDrawerOpen, useToggleAccountDrawer()]
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

const AccountDrawerScrollWrapper = styled.div`
  overflow: hidden;
  &:hover {
    overflow-y: auto;
  }

  ${ScrollBarStyles}

  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  border-radius: 12px;
`

const AccountDrawerWrapper = styled.div<{ open: boolean }>`
  position: fixed;
  top: ${DRAWER_MARGIN};
  right: ${({ open }) => (open ? DRAWER_MARGIN : '-' + DRAWER_WIDTH)};
  z-index: ${Z_INDEX.fixed};

  overflow: hidden;

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

  @media screen and (min-width: 1440px) {
    right: ${({ open }) => (open ? DRAWER_MARGIN : '-' + DRAWER_WIDTH_XL)};
    width: ${DRAWER_WIDTH_XL};
  }

  border-radius: 12px;
  width: ${DRAWER_WIDTH};
  font-size: 16px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};

  box-shadow: ${({ theme }) => theme.deepShadow};
  transition: right ${({ theme }) => theme.transition.duration.medium},
    bottom ${({ theme }) => theme.transition.duration.medium};
`

const CloseIcon = styled(ChevronsRight).attrs({ size: 24 })`
  stroke: ${({ theme }) => theme.textSecondary};
`

const CloseDrawer = styled.div`
  ${ClickableStyle}
  cursor: pointer;
  height: calc(100% - 2 * ${DRAWER_MARGIN});
  position: fixed;
  right: calc(${DRAWER_MARGIN} + ${DRAWER_WIDTH} - ${DRAWER_OFFSET});
  top: 4px;
  z-index: ${Z_INDEX.dropdown};
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
  @media screen and (min-width: 1440px) {
    right: calc(${DRAWER_MARGIN} + ${DRAWER_WIDTH_XL} - ${DRAWER_OFFSET});
  }
`

function AccountDrawer() {
  const [walletDrawerOpen, toggleWalletDrawer] = useAccountDrawer()
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
    <>
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
      <AccountDrawerWrapper open={walletDrawerOpen}>
        {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
        <AccountDrawerScrollWrapper ref={scrollRef} id="wallet-dropdown-scroll-wrapper">
          <DefaultMenu />
        </AccountDrawerScrollWrapper>
      </AccountDrawerWrapper>
    </>
  )
}

export default AccountDrawer
