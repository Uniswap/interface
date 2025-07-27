import DefaultMenu from 'components/AccountDrawer/DefaultMenu'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Scrim } from 'components/AccountDrawer/Scrim'
import { Web3StatusRef } from 'components/Web3Status'
import { useAccount } from 'hooks/useAccount'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useIsUniExtensionConnected } from 'hooks/useIsUniExtensionConnected'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import usePrevious from 'hooks/usePrevious'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { transitions } from 'theme/styles'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  WebBottomSheet,
  styled,
  useMedia,
  useScrollbarStyles,
  useShadowPropsMedium,
} from 'ui/src'
import { INTERFACE_NAV_HEIGHT, breakpoints, zIndexes } from 'ui/src/theme'
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
  zIndex: zIndexes.modal,
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
  zIndex: zIndexes.modal,
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
  const scrollbarStyles = useScrollbarStyles()
  const accountDrawer = useAccountDrawer()
  const shadowProps = useShadowPropsMedium()
  const wasAccountDrawerOpen = usePrevious(accountDrawer.isOpen)
  const scrollRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (wasAccountDrawerOpen && !accountDrawer.isOpen) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [accountDrawer, wasAccountDrawerOpen])

  useOnClickOutside({
    node: drawerRef,
    handler: onClose,
  })

  return (
    <>
      <Scrim $open={isOpen} $maxWidth={breakpoints.xxxl} $zIndex={zIndexes.modalBackdrop} onClick={onClose} />
      <Flex row height={`calc(100% - 2 * ${DRAWER_SPECS.MARGIN})`}>
        <SideDrawerContainer ref={drawerRef} open={isOpen} {...shadowProps}>
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
    </>
  )
}

function Drawer({ children }: { children: JSX.Element | JSX.Element[] }) {
  const accountDrawer = useAccountDrawer()
  const isUniExtensionConnected = useIsUniExtensionConnected()
  const media = useMedia()
  const isAccountConnected = useAccount().isConnected

  if (media.md) {
    return (
      <WebBottomSheet data-testid={TestID.AccountDrawer} isOpen={accountDrawer.isOpen} onClose={accountDrawer.close}>
        {children}
      </WebBottomSheet>
    )
  } else if (!isUniExtensionConnected && isAccountConnected) {
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
      <DefaultMenu />
    </Drawer>
  )
}

export default AccountDrawer
