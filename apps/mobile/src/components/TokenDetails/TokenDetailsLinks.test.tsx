import { UniverseChainId } from '@universe/chains'
import { spacing } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { fireEvent, render, screen } from 'src/test/test-utils'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import type { MockedFunction } from 'vitest'

const scrollViewPropsSpy = vi.hoisted(() => vi.fn())
const platform = vi.hoisted(() => ({ isAndroid: false, isIOS: true }))

const TEST_ENTRIES: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', isNative: false },
  { chainId: UniverseChainId.Base, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', isNative: false },
]

vi.mock('@universe/environment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/environment')>()),
  get isAndroid(): boolean {
    return platform.isAndroid
  },
  get isIOS(): boolean {
    return platform.isIOS
  },
}))

vi.mock('uniswap/src/hooks/useAppInsets', () => ({
  useAppInsets: vi.fn(),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: (props: { children: ReactNode }) => props.children,
}))

vi.mock('@gorhom/bottom-sheet', async () => {
  const { Flex } = await vi.importActual<typeof import('@universe/mycelium')>('@universe/mycelium')
  return {
    BottomSheetScrollView: (props: { children: ReactNode }) => {
      scrollViewPropsSpy(props)
      return <Flex>{props.children}</Flex>
    },
  }
})

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({ data: undefined }),
}))

vi.mock('uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries', () => ({
  useOrderedMultichainEntries: () => TEST_ENTRIES,
}))

vi.mock('uniswap/src/components/MultichainTokenDetails/MultichainExplorerList', () => ({
  MultichainExplorerList: () => null,
}))

vi.mock('uniswap/src/components/MultichainTokenDetails/MultichainAddressSheet', () => ({
  MultichainAddressSheet: () => null,
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', () => ({
  useTokenMetadata: () => ({ homepageUrl: undefined, twitterName: undefined }),
}))

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: () => ({
    address: TEST_ENTRIES[0]!.address,
    chainId: UniverseChainId.Mainnet,
    currencyId: `1-${TEST_ENTRIES[0]!.address}`,
    isMultichainAddressSheetOpen: false,
    openMultichainAddressSheet: vi.fn(),
    closeMultichainAddressSheet: vi.fn(),
  }),
}))

const mockUseAppInsets = useAppInsets as MockedFunction<typeof useAppInsets>

function explorerSheetContentContainerStyle({ bottomInset }: { bottomInset: number }): { paddingBottom?: number } {
  mockUseAppInsets.mockReturnValue({ top: 44, right: 0, bottom: bottomInset, left: 0 })
  scrollViewPropsSpy.mockClear()
  render(<TokenDetailsLinks />)
  fireEvent.press(screen.getByTestId(TestID.MultichainExplorerDropdown))
  return (scrollViewPropsSpy.mock.calls[0]?.[0] as { contentContainerStyle: { paddingBottom?: number } })
    .contentContainerStyle
}

describe(TokenDetailsLinks, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    platform.isAndroid = false
    platform.isIOS = true
  })

  // The explorer sheet passes `overrideInnerContainer`, so the Modal's BottomSheetView — and with it
  // the `insets.bottom` padding — is never rendered. Without a bottom inset here the last chain row
  // sits under the Android navigation bar and its taps land on the row above (CONS-3465).
  it('pads the explorer sheet clear of the Android three-button navigation bar', () => {
    platform.isAndroid = true
    platform.isIOS = false

    // 48 is the measured Android three-button nav bar inset; the total is written out rather than
    // derived from useBottomScreenGap so a change to the gap formula fails this test.
    const style = explorerSheetContentContainerStyle({ bottomInset: 48 })

    expect(style.paddingBottom).toBe(48 + spacing.spacing16 + spacing.spacing8)
    expect(style.paddingBottom).toBeGreaterThan(48)
  })

  it('pads the explorer sheet clear of the iOS home indicator', () => {
    const style = explorerSheetContentContainerStyle({ bottomInset: 34 })

    expect(style.paddingBottom).toBe(34 + spacing.spacing16)
  })
})
