import { InterfaceEventName } from '@uniswap/analytics-events'
import DefaultMenu from 'components/AccountDrawer/DefaultMenu'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Web3StatusRef } from 'components/Web3Status'
import { useAccount } from 'hooks/useAccount'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useIsUniExtensionConnected } from 'hooks/useIsUniExtensionConnected'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import usePrevious from 'hooks/usePrevious'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { ChevronsRight } from 'react-feather'
import { transitions } from 'theme/styles'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  TouchableArea,
  WebBottomSheet,
  styled,
  useMedia,
  useScrollbarStyles,
  useShadowPropsMedium,
  useSporeColors,
} from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'

const DRAWER_SPECS = {
  WIDTH_XL: '390px',
  WIDTH: '320px',
  MARGIN: '8px',
  OFFSET: '10px',
}

export const MODAL_WIDTH = '368px'

const AccountDrawerScrollWrapper = styled(Flex, {
  '$platform-web': {
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
  },
  borderRadius: '$rounded20',
})

const ExtensionContainerStyles: FlexProps = {
  height: 'auto',
  width: MODAL_WIDTH,
  right: '$spacing12',
  top: INTERFACE_NAV_HEIGHT,
} as const

const Container = styled(Flex, {
  height: '100%',
  '$platform-web': { position: 'fixed' },
  top: DRAWER_SPECS.MARGIN,
  right: '0',
  zIndex: zIndexes.dropdown,
  variants: {
    open: {
      true: { right: DRAWER_SPECS.MARGIN },
    },
    isUniExtensionConnected: {
      true: ExtensionContainerStyles,
      false: {
        width: DRAWER_SPECS.WIDTH_XL,
        maxWidth: DRAWER_SPECS.WIDTH_XL,
      },
    },
  },
})

const sharedContainerStyles: FlexProps = {
  borderRadius: '$rounded12',
  backgroundColor: '$surface1',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
} as const

const DropdownContainer = styled(Flex, {
  ...sharedContainerStyles,
  maxHeight: `calc(100vh - ${INTERFACE_NAV_HEIGHT + 16}px)`,
  borderRadius: '$rounded20',
  animation: 'fastHeavy',
  transformOrigin: 'right top',
  enterStyle: { opacity: 0, scale: 0.98 },
  exitStyle: { opacity: 0, scale: 0.98 },
})

const SideDrawerContainer = styled(Flex, {
  ...sharedContainerStyles,
  mr: `-${DRAWER_SPECS.WIDTH_XL}`,
  transition: `margin-right ${transitions.duration.medium}`,
  width: DRAWER_SPECS.WIDTH_XL,
  maxWidth: DRAWER_SPECS.WIDTH_XL,
  $xl: {
    mr: `-${DRAWER_SPECS.WIDTH}`,
    width: DRAWER_SPECS.WIDTH,
    maxWidth: DRAWER_SPECS.WIDTH,
  },
  variants: {
    open: {
      true: {
        mr: 8,
        $xl: { mr: 8 },
      },
    },
  },
})

const CloseDrawer = styled(Flex, {
  animation: 'fast',
  opacity: 0.6,
  height: '100%',
  p: '$spacing24',
  pl: '$spacing12',
  pr: `calc(18px + ${DRAWER_SPECS.OFFSET})`,
  borderTopLeftRadius: '$rounded20',
  borderBottomLeftRadius: '$rounded20',
  borderTopRightRadius: '$none',
  borderBottomRightRadius: '$none',
  '$group-hover': {
    x: '$spacing8',
    backgroundColor: 'rgba(153,161,189,0.08)',
  },
})

type AccountDrawerProps = {
  isOpen: boolean
  onClose: () => void
  children: JSX.Element | JSX.Element[]
}

function AccountDropdown({ isOpen, onClose, children }: AccountDrawerProps) {
  const shadowProps = useShadowPropsMedium()
  const scrollbarStyles = useScrollbarStyles()
  const modalRef = useRef<HTMLDivElement>(null)
  const [web3StatusRef] = useAtom(Web3StatusRef)

  useOnClickOutside(
    modalRef,
    () => {
      onClose()
    },
    // Prevents quick close & re-open when tapping the Web3Status
    // stopPropagation does not work here
    web3StatusRef ? [web3StatusRef] : [],
  )
  return (
    <AnimatePresence>
      {isOpen && (
        <DropdownContainer
          ref={modalRef}
          animation="fastHeavy"
          {...shadowProps}
          style={scrollbarStyles}
          $platform-web={{ overflow: 'auto' }}
        >
          {children}
        </DropdownContainer>
      )}
    </AnimatePresence>
  )
}

function AccountSideDrawer({ isOpen, onClose, children }: AccountDrawerProps) {
  const colors = useSporeColors()
  const scrollbarStyles = useScrollbarStyles()
  const accountDrawer = useAccountDrawer()
  const shadowProps = useShadowPropsMedium()
  const wasAccountDrawerOpen = usePrevious(accountDrawer.isOpen)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (wasAccountDrawerOpen && !accountDrawer.isOpen) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [accountDrawer, wasAccountDrawerOpen])

  return (
    <Flex row height={`calc(100% - 2 * ${DRAWER_SPECS.MARGIN})`}>
      {isOpen && (
        <Trace logPress eventOnTrigger={InterfaceEventName.MINI_PORTFOLIO_TOGGLED} properties={{ type: 'close' }}>
          <TouchableArea group zIndex={zIndexes.background} width={60}>
            <CloseDrawer onPress={onClose} data-testid="close-account-drawer">
              <ChevronsRight color={colors.neutral2.val} size={24} />
            </CloseDrawer>
          </TouchableArea>
        </Trace>
      )}
      <SideDrawerContainer open={isOpen} {...shadowProps}>
        {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
        <AccountDrawerScrollWrapper
          ref={scrollRef}
          style={scrollbarStyles}
          id="wallet-dropdown-scroll-wrapper"
          height="100%"
        >
          {children}
        </AccountDrawerScrollWrapper>
      </SideDrawerContainer>
    </Flex>
  )
}

function Drawer({ children }: { children: JSX.Element | JSX.Element[] }) {
  const accountDrawer = useAccountDrawer()
  const isUniExtensionConnected = useIsUniExtensionConnected()
  const media = useMedia()
  const isAccountConnected = useAccount().isConnected

  if (media.md) {
    return (
      <WebBottomSheet data-testid="account-drawer" isOpen={accountDrawer.isOpen} onClose={accountDrawer.close}>
        {children}
      </WebBottomSheet>
    )
  } else if (!isUniExtensionConnected && isAccountConnected) {
    return (
      <Container data-testid="account-drawer">
        <AccountSideDrawer isOpen={accountDrawer.isOpen} onClose={accountDrawer.close}>
          {children}
        </AccountSideDrawer>
      </Container>
    )
  } else {
    return (
      <Container data-testid="account-drawer" isUniExtensionConnected>
        <AccountDropdown isOpen={accountDrawer.isOpen} onClose={accountDrawer.close}>
          {children}
        </AccountDropdown>
      </Container>
    )
  }
}

function AccountDrawer() {
  const accountDrawer = useAccountDrawer()

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

  useDisableScrolling(accountDrawer.isOpen)

  return (
    <Drawer>
      <DefaultMenu />
    </Drawer>
  )
}

export default AccountDrawer
