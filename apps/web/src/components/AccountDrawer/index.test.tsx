import { TestID } from '@universe/test'
import { AccountDrawer, MODAL_WIDTH } from '~/components/AccountDrawer'
import { useIsUniswapExtensionConnected } from '~/hooks/useIsUniswapExtensionConnected'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { mocked } from '~/test-utils/mocked'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen } from '~/test-utils/render'

vi.mock('~/hooks/useIsUniswapExtensionConnected', () => ({
  useIsUniswapExtensionConnected: vi.fn(),
}))

vi.mock('~/features/wallet/connection/hooks/useIsMetaMaskExtensionDetected', () => ({
  useIsMetaMaskExtensionDetected: vi.fn(() => true),
}))

let isDrawerOpen = true

vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/components/AccountDrawer/MiniPortfolio/hooks')>()
  return {
    ...actual,
    useAccountDrawer: vi.fn(() => ({
      isOpen: isDrawerOpen,
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    })),
  }
})

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(() => ({
    evmAddress: '0x0000000000000000000000000000000000000000',
    svmAddress: undefined,
  })),
  useConnectionStatus: vi.fn((platform?: any) => {
    // For Solana (svm), return not connected
    if (platform === 'svm') {
      return {
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
      }
    }
    // For EVM (default), return connected
    return {
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    }
  }),
}))

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

vi.mock('uniswap/src/components/AnimatedNumber/AnimatedNumber', () => {
  const mockAnimatedNumber = ({ value }: { value: number }) => {
    return <div>{value}</div>
  }
  return {
    default: mockAnimatedNumber,
    AnimatedNumber: mockAnimatedNumber,
  }
})

describe('AccountDrawer tests', () => {
  beforeEach(() => {
    isDrawerOpen = true
  })

  it('AccountDrawer default styles', () => {
    mocked(useIsUniswapExtensionConnected).mockReturnValue(true)
    mockMediaSize('xxl')

    render(<AccountDrawer />)
    expect(document.body).toMatchSnapshot()
    const drawerWrapper = screen.getByTestId(TestID.AccountDrawer)
    expect(drawerWrapper).toBeInTheDocument()
    const drawerContainer = screen.getByTestId(TestID.AccountDrawerContainer)
    // Asserts the wrapper's own authored `width`, not a styling-engine class name: Tamagui compiles
    // width={MODAL_WIDTH} to `_width-368px` while mycelium's FlexCompat emits a `w-[var(--c-w)]`
    // Tailwind class backed by an inline custom property, so pinning either class name would break
    // the moment this file swaps styling engines. `getOwnStyleProp` reads the prop engine-agnostically.
    expect(getOwnStyleProp(drawerContainer, 'width')).toBe(MODAL_WIDTH)
  })

  // The container is always mounted, fixed, 368px wide and at the sidebar z-index. On a narrow viewport
  // that empty box spans the page just under the header and used to swallow taps meant for the content
  // beneath it (breadcrumb links). It must only accept pointer events while it actually has content.
  it('does not intercept pointer events while closed', () => {
    mocked(useIsUniswapExtensionConnected).mockReturnValue(true)
    mockMediaSize('sm')
    isDrawerOpen = false

    render(<AccountDrawer />)

    const drawerContainer = screen.getByTestId(TestID.AccountDrawerContainer)
    expect(getOwnStyleProp(drawerContainer, 'pointerEvents')).toBe('none')
  })

  it('accepts pointer events once open, so the drawer itself stays interactive', () => {
    mocked(useIsUniswapExtensionConnected).mockReturnValue(true)
    mockMediaSize('sm')
    isDrawerOpen = true

    render(<AccountDrawer />)

    const drawerContainer = screen.getByTestId(TestID.AccountDrawerContainer)
    expect(getOwnStyleProp(drawerContainer, 'pointerEvents')).toBe('auto')
  })
})
