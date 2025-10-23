import DefaultMenu from 'components/AccountDrawer/DefaultMenu'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Web3StatusRef } from 'components/Web3Status'
import { WebNotificationToastWrapper } from 'features/notifications/WebNotificationToastWrapper'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useIsUniswapExtensionConnected } from 'hooks/useIsUniswapExtensionConnected'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import usePrevious from 'hooks/usePrevious'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { ChevronsRight } from 'react-feather'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  styled,
  TouchableArea,
  useMedia,
  useScrollbarStyles,
  useShadowPropsMedium,
  useSporeColors,
  WebBottomSheet,
} from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
  zIndex: zIndexes.sidebar,
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
  width: DRAWER_SPECS.WIDTH_XL,
  maxWidth: DRAWER_SPECS.WIDTH_XL,
  animation: 'fastHeavy',
  enterStyle: { x: '100%' },
  exitStyle: { x: '100%' },
  $xl: {
    width: DRAWER_SPECS.WIDTH,
    maxWidth: DRAWER_SPECS.WIDTH,
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
  hoverStyle: {
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

  useOnClickOutside({
    node: modalRef,
    handler: onClose,
    // Prevents quick close & re-open when tapping the Web3Status
    // stopPropagation does not work here
    ignoredNodes: web3StatusRef ? [web3StatusRef] : [],
  })
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
        <Trace logPress eventOnTrigger={InterfaceEventName.MiniPortfolioToggled} properties={{ type: 'close' }}>
          <TouchableArea group zIndex={zIndexes.background} width={60}>
            <CloseDrawer onPress={onClose} data-testid="close-account-drawer">
              <ChevronsRight color={colors.neutral2.val} size={24} />
            </CloseDrawer>
          </TouchableArea>
        </Trace>
      )}
      <AnimatePresence>
        {isOpen && (
          <SideDrawerContainer {...shadowProps}>
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
        )}
      </AnimatePresence>
    </Flex>
  )
}

function Drawer({ children }: { children: JSX.Element | JSX.Element[] }) {
  const accountDrawer = useAccountDrawer()
  const isUniExtensionConnected = useIsUniswapExtensionConnected()
  const media = useMedia()
  const { isConnected } = useConnectionStatus()
  const isSolanaConnected = useConnectionStatus(Platform.SVM).isConnected

  if (media.md) {
    return (
      <WebBottomSheet data-testid={TestID.AccountDrawer} isOpen={accountDrawer.isOpen} onClose={accountDrawer.close}>
        {children}
      </WebBottomSheet>
    )
  } else if ((!isUniExtensionConnected && isConnected) || (isUniExtensionConnected && isSolanaConnected)) {
    return (
      <Container data-testid={TestID.AccountDrawer}>
        <AccountSideDrawer isOpen={accountDrawer.isOpen} onClose={accountDrawer.close}>
          {children}
        </AccountSideDrawer>
      </Container>
    )
  } else {
    return (
      <Container data-testid={TestID.AccountDrawer} isUniExtensionConnected>
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
      <WebNotificationToastWrapper />
      <DefaultMenu />
    </Drawer>
  )
}

export default AccountDrawer
