import { UniverseChainId } from '@universe/chains'
import { spacing } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { MultichainAddressSheet } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressSheet.native'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { render } from 'uniswap/src/test/test-utils'
import type { MockedFunction } from 'vitest'

const scrollViewPropsSpy = vi.hoisted(() => vi.fn())
const platform = vi.hoisted(() => ({ isAndroid: false, isIOS: true }))

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

const mockUseAppInsets = useAppInsets as MockedFunction<typeof useAppInsets>

const TEST_ENTRIES: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', isNative: false },
  { chainId: UniverseChainId.Base, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', isNative: false },
]

function contentContainerStyleFor({ bottomInset }: { bottomInset: number }): { paddingBottom?: number } {
  mockUseAppInsets.mockReturnValue({ top: 44, right: 0, bottom: bottomInset, left: 0 })
  scrollViewPropsSpy.mockClear()
  render(<MultichainAddressSheet isOpen chains={TEST_ENTRIES} onClose={vi.fn()} />)
  return (scrollViewPropsSpy.mock.calls[0]?.[0] as { contentContainerStyle: { paddingBottom?: number } })
    .contentContainerStyle
}

describe(MultichainAddressSheet, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    platform.isAndroid = false
    platform.isIOS = true
  })

  // The sheet passes `overrideInnerContainer`, so the Modal's BottomSheetView — and with it the
  // `insets.bottom` padding — is never rendered. Without a bottom inset here the last chain row
  // sits under the Android navigation bar and its taps land on the row above (CONS-3465).
  it('clears the Android three-button navigation bar', () => {
    platform.isAndroid = true
    platform.isIOS = false

    // 48 is the measured Android three-button nav bar inset; the expected total is written out
    // rather than derived from the hook so a change to the gap formula fails this test.
    const style = contentContainerStyleFor({ bottomInset: 48 })

    expect(style.paddingBottom).toBe(48 + spacing.spacing16 + spacing.spacing8)
    expect(style.paddingBottom).toBeGreaterThan(48)
  })

  it('tracks the safe-area inset rather than a fixed value', () => {
    platform.isAndroid = true
    platform.isIOS = false

    const gestureNav = contentContainerStyleFor({ bottomInset: 24 })
    const threeButtonNav = contentContainerStyleFor({ bottomInset: 48 })

    expect(threeButtonNav.paddingBottom).toBe((gestureNav.paddingBottom ?? 0) + 24)
  })

  it('clears the iOS home indicator', () => {
    const style = contentContainerStyleFor({ bottomInset: 34 })

    expect(style.paddingBottom).toBe(34 + spacing.spacing16)
  })
})
