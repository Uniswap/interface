import { InterfaceEventName } from '@uniswap/analytics-events'
import DefaultMenu from 'components/AccountDrawer/DefaultMenu'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { SignInModal } from 'components/AccountDrawer/SignInModal'
import { ScrollBarStyles } from 'components/Common/styles'
import { Web3StatusRef } from 'components/Web3Status'
import { useAccount } from 'hooks/useAccount'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import usePrevious from 'hooks/usePrevious'
import { useIsUniExtensionAvailable } from 'hooks/useUniswapWalletOptions'
import { atom, useAtom } from 'jotai'
import styled, { css } from 'lib/styled-components'
import { useEffect, useRef, useState } from 'react'
import { ChevronsRight } from 'react-feather'
import { useGesture } from 'react-use-gesture'
import { ClickableStyle } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { INTERFACE_NAV_HEIGHT, breakpoints } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useWindowSize } from 'uniswap/src/hooks/useWindowSize'
import { isMobileWeb } from 'utilities/src/platform'

const DRAWER_WIDTH_XL = '390px'
const DRAWER_WIDTH = '320px'
const DRAWER_MARGIN = '8px'
const DRAWER_OFFSET = '10px'

export const MODAL_WIDTH = '368px'

export enum MenuState {
  DEFAULT = 'default',
  SETTINGS = 'settings',
  LANGUAGE_SETTINGS = 'language_settings',
  LOCAL_CURRENCY_SETTINGS = 'local_currency_settings',
  LIMITS = 'limits',
  POOLS = 'pools',
}

export const miniPortfolioMenuStateAtom = atom(MenuState.DEFAULT)

const ScrimBackground = styled.div<{ $open: boolean; $maxWidth?: number; $zIndex?: number }>`
  z-index: ${({ $zIndex }) => $zIndex ?? Z_INDEX.modalBackdrop};
  overflow: hidden;
  top: 0;
  left: 0;
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.scrim};

  opacity: 0;
  pointer-events: none;
  @media only screen and (max-width: ${({ theme, $maxWidth }) => `${$maxWidth ?? theme.breakpoint.md}px`}) {
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition: opacity ${({ theme }) => theme.transition.duration.medium} ease-in-out;
  }
`

interface ScrimBackgroundProps extends React.ComponentPropsWithRef<'div'> {
  $open: boolean
  $maxWidth?: number
  $zIndex?: number
}

export const Scrim = (props: ScrimBackgroundProps) => {
  const { width } = useWindowSize()

  useEffect(() => {
    if (width && width < breakpoints.md && props.$open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'visible'
    }
  }, [props.$open, width])

  return <ScrimBackground {...props} />
}

const AccountDrawerScrollWrapper = styled.div`
  overflow-y: auto;
  overflow-x: hidden;

  ${ScrollBarStyles}

  overscroll-behavior: contain;
  border-radius: 12px;
`

const Container = styled.div<{ isUniExtensionAvailable?: boolean; $open?: boolean }>`
  display: flex;
  flex-direction: row;
  height: calc(100% - 2 * ${DRAWER_MARGIN});
  position: fixed;
  right: ${({ $open }) => ($open ? DRAWER_MARGIN : 0)};
  top: ${DRAWER_MARGIN};
  z-index: ${Z_INDEX.fixed};

  ${({ isUniExtensionAvailable }) => isUniExtensionAvailable && ExtensionContainerStyles}

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    height: 100%;
    top: 100%;
    left: 0;
    right: 0;
    width: 100%;
    overflow: visible;
  }
`

const ExtensionContainerStyles = css`
  height: auto;
  max-height: calc(100% - ${INTERFACE_NAV_HEIGHT + 16}px);
  right: 12px;
  top: ${INTERFACE_NAV_HEIGHT}px;
  ${ScrollBarStyles}
`

const AccountDrawerWrapper = styled.div<{ open: boolean; isUniExtensionAvailable?: boolean }>`
  margin-right: ${({ open, isUniExtensionAvailable }) =>
    open ? 0 : '-' + (isUniExtensionAvailable ? MODAL_WIDTH : DRAWER_WIDTH)};
  height: 100%;
  overflow: hidden;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    z-index: ${Z_INDEX.modal};
    position: absolute;
    margin-right: 0;
    top: ${({ open }) => (open ? `calc(-1 * (100% - ${INTERFACE_NAV_HEIGHT}px))` : 0)};
    height: calc(100% - ${INTERFACE_NAV_HEIGHT}px);

    width: 100%;
    max-width: 100%;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
    box-shadow: unset;
    transition: top ${({ theme }) => theme.transition.duration.medium};
  }

  @media screen and (min-width: 1440px) {
    margin-right: ${({ open }) => (open ? 0 : `-${DRAWER_WIDTH_XL}`)};
    width: ${DRAWER_WIDTH_XL};
    max-width: ${DRAWER_WIDTH_XL};
  }

  border-radius: 12px;
  width: ${DRAWER_WIDTH};
  max-width: ${DRAWER_WIDTH};
  font-size: 16px;
  background-color: ${({ theme }) => theme.surface1};
  border: ${({ theme }) => `1px solid ${theme.surface3}`};

  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  transition: margin-right ${({ theme }) => theme.transition.duration.medium};

  ${({ isUniExtensionAvailable }) => isUniExtensionAvailable && ExtensionDrawerWrapperStyles}
`

const ExtensionDrawerWrapperStyles = css<{ open: boolean }>`
  ${ScrollBarStyles}
  height: max-content;
  max-height: 100%;
  width: ${MODAL_WIDTH};
  max-width: ${MODAL_WIDTH};
  border-radius: 20px;
  transform: scale(${({ open }) => (open ? 1 : 0.96)});
  transform-origin: top right;
  opacity: ${({ open }) => (open ? 1 : 0)};
  overflow-y: auto;
  transition: ${({ theme }) => `transform ${theme.transition.duration.fast} ${theme.transition.timing.inOut},
    opacity ${theme.transition.duration.fast} ${theme.transition.timing.inOut}`};
`

const CloseIcon = styled(ChevronsRight).attrs({ size: 24 })`
  stroke: ${({ theme }) => theme.neutral2};
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
    z-index: -1;
    margin: 0 -8px 0 0;
    background-color: ${({ theme }) => theme.deprecated_stateOverlayHover};
  }
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    display: none;
  }
`

function AccountDrawer() {
  const accountDrawer = useAccountDrawer()
  const wasAccountDrawerOpen = usePrevious(accountDrawer.isOpen)
  const scrollRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const isUniExtensionAvailable = useIsUniExtensionAvailable()
  const [web3StatusRef] = useAtom(Web3StatusRef)
  const account = useAccount()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  useOnClickOutside(
    modalRef,
    () => {
      if (isUniExtensionAvailable) {
        accountDrawer.close()
      }
    },
    // Prevents quick close & re-open when tapping the Web3Status
    // stopPropagation does not work here
    web3StatusRef ? [web3StatusRef] : [],
  )

  useEffect(() => {
    if (wasAccountDrawerOpen && !accountDrawer.isOpen) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [accountDrawer, wasAccountDrawerOpen])

  // close on escape keypress
  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && accountDrawer.isOpen) {
        event.preventDefault()
        accountDrawer.close()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [accountDrawer])

  // useStates for detecting swipe gestures
  const [yPosition, setYPosition] = useState(0)
  const [dragStartTop, setDragStartTop] = useState(true)
  useDisableScrolling(accountDrawer.isOpen)

  // useGesture hook for detecting swipe gestures
  const bind = useGesture({
    // if the drawer is open and the user is dragging down, close the drawer
    onDrag: (state) => {
      // if the user is dragging up, set dragStartTop to false
      if (state.movement[1] < 0) {
        setDragStartTop(false)
        if (scrollRef.current) {
          scrollRef.current.style.overflowY = 'auto'
        }
      } else if (
        (state.movement[1] > 300 || (state.velocity > 3 && state.direction[1] > 0)) &&
        accountDrawer.isOpen &&
        dragStartTop
      ) {
        accountDrawer.close()
      } else if (accountDrawer.isOpen && dragStartTop && state.movement[1] > 0) {
        setYPosition(state.movement[1])
        if (scrollRef.current) {
          scrollRef.current.style.overflowY = 'hidden'
        }
      }
    },
    // reset the yPosition when the user stops dragging
    onDragEnd: () => {
      setYPosition(0)
      if (scrollRef.current) {
        scrollRef.current.style.overflowY = 'auto'
      }
    },
    // set dragStartTop to true if the user starts dragging from the top of the drawer
    onDragStart: () => {
      if (!scrollRef.current?.scrollTop || scrollRef.current?.scrollTop < 30) {
        setDragStartTop(true)
      } else {
        setDragStartTop(false)
        if (scrollRef.current) {
          scrollRef.current.style.overflowY = 'auto'
        }
      }
    },
  })

  return account?.address || !isEmbeddedWalletEnabled ? (
    <Container isUniExtensionAvailable={isUniExtensionAvailable} $open={accountDrawer.isOpen}>
      {accountDrawer.isOpen && !isUniExtensionAvailable && (
        <Trace logPress eventOnTrigger={InterfaceEventName.MINI_PORTFOLIO_TOGGLED} properties={{ type: 'close' }}>
          <CloseDrawer onClick={accountDrawer.close} data-testid="close-account-drawer">
            <CloseIcon />
          </CloseDrawer>
        </Trace>
      )}
      <Scrim onClick={accountDrawer.close} $open={accountDrawer.isOpen} />
      <AccountDrawerWrapper
        isUniExtensionAvailable={isUniExtensionAvailable}
        ref={modalRef}
        data-testid="account-drawer"
        open={accountDrawer.isOpen}
        {...(isMobileWeb
          ? {
              ...bind(),
              style: { transform: `translateY(${yPosition}px)` },
            }
          : {})}
      >
        {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
        <AccountDrawerScrollWrapper ref={scrollRef} id="wallet-dropdown-scroll-wrapper">
          <DefaultMenu drawerOpen={accountDrawer.isOpen} />
        </AccountDrawerScrollWrapper>
      </AccountDrawerWrapper>
    </Container>
  ) : (
    <SignInModal isOpen={accountDrawer.isOpen} close={accountDrawer.close} />
  )
}

export default AccountDrawer
