import { type GasFeeResult } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import * as Reanimated from 'react-native-reanimated'
import { GasInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRow'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { render } from 'uniswap/src/test/test-utils'

// Defaults match the ambient test env (jsdom resolves the .web.* legs); each describe sets what
// it needs and the top-level beforeEach restores these. The opacity fork reads only
// isWebPlatform. isWebApp is pinned alongside it because the two disagreeing is what makes a
// build the extension, and in this row isWebApp itself only moves the tooltip placement and the
// high-gas color.
const mockPlatform = vi.hoisted(() => ({ isWebApp: false, isWebPlatform: true }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebApp(): boolean {
      return mockPlatform.isWebApp
    },
    get isWebPlatform(): boolean {
      return mockPlatform.isWebPlatform
    },
  }
})

describe('GasInfoRow opacity legs', () => {
  const createGasInfo = (overrides: Partial<GasInfo> = {}): GasInfo => ({
    gasFee: { value: '1000000000000000', isLoading: false, error: null } as GasFeeResult,
    fiatPriceFormatted: '$2.50',
    isHighRelativeToValue: false,
    isLoading: false,
    chainId: UniverseChainId.Mainnet,
    ...overrides,
  })

  beforeEach(() => {
    mockPlatform.isWebApp = false
    mockPlatform.isWebPlatform = true
  })

  // The reanimated test double caches useAnimatedStyle's result, so the settled opacity is not
  // readable off the rendered tree; capture the shared values the row creates instead. The
  // double re-invokes useSharedValue on every render and hands back the same instance, so only
  // distinct instances are collected.
  let sharedValues: { value: number }[] = []
  beforeEach(() => {
    sharedValues = []
    const useSharedValue = Reanimated.useSharedValue
    vi.spyOn(Reanimated, 'useSharedValue').mockImplementation(((initial: number) => {
      const sharedValue = (useSharedValue as (i: number) => { value: number })(initial)
      if (!sharedValues.includes(sharedValue)) {
        sharedValues.push(sharedValue)
      }
      return sharedValue
    }) as typeof Reanimated.useSharedValue)
  })

  // The row owns exactly one shared value. Asserting that here keeps a second one added anywhere
  // in the tree from silently retargeting the assertions onto whichever was created last.
  const rowOpacity = (): { value: number } => {
    expect(sharedValues).toHaveLength(1)
    return sharedValues[0] as { value: number }
  }

  describe('native leg', () => {
    beforeEach(() => {
      mockPlatform.isWebPlatform = false
    })

    it('falls back to the 0 seed while the row renders null, so every re-show fades in', () => {
      // TradeInfoRow renders this row unconditionally, so the instance below stays mounted
      // across the empty period rather than remounting the way the web leg does.
      const { rerender } = render(<GasInfoRow gasInfo={createGasInfo({ fiatPriceFormatted: undefined })} />)
      expect(rowOpacity().value).toBe(0)

      rerender(<GasInfoRow gasInfo={createGasInfo()} />)
      expect(rowOpacity().value).toBe(1)

      // A new quote clears the price: the row renders null and must drop back to the seed,
      // otherwise the next fade is a 1 to 1 no-op and the row pops in.
      rerender(<GasInfoRow gasInfo={createGasInfo({ fiatPriceFormatted: undefined })} />)
      expect(rowOpacity().value).toBe(0)

      rerender(<GasInfoRow gasInfo={createGasInfo()} />)
      expect(rowOpacity().value).toBe(1)
    })

    it('leaves the hidden and isLoading targets alone, since canRender stays true across them', () => {
      const { rerender } = render(<GasInfoRow gasInfo={createGasInfo()} />)
      expect(rowOpacity().value).toBe(1)

      rerender(<GasInfoRow hidden gasInfo={createGasInfo()} />)
      expect(rowOpacity().value).toBe(0)

      rerender(<GasInfoRow gasInfo={createGasInfo({ isLoading: true })} />)
      expect(rowOpacity().value).toBe(0.6)

      rerender(<GasInfoRow gasInfo={createGasInfo()} />)
      expect(rowOpacity().value).toBe(1)
    })
  })

  describe('extension build', () => {
    beforeEach(() => {
      mockPlatform.isWebApp = false
      mockPlatform.isWebPlatform = true
    })

    // The state class lands on the AnimatedFlex host above the testID, with tailwind-merge
    // having already collapsed the preset's opacity-[1] against it. No such ancestor means the
    // row took the worklet style leg, which the web AnimatedFlex leg cannot apply. The cast is
    // needed because this project's render maps the RNTL queries onto react-dom, so a query
    // returns a DOM element at runtime even though the RNTL types name ReactTestInstance.
    const mergedOpacityClass = (node: unknown): string => {
      const host = (node as Element).closest('[class*="opacity-"]')
      if (host === null) {
        throw new Error('no opacity class found: the row took the worklet style leg')
      }
      return host.className
    }

    // Two halves of one invariant: the state class survives, and the preset's own opacity-[1]
    // does not. The first fails if the state class stops winning the conflict, the second if
    // the two ever stop being one tailwind-merge group, which is the premise the ordering in
    // GasInfoRow's cn call rests on. Both surviving would leave the cascade order deciding.
    const expectOpacityClass = (node: unknown, expected: string): void => {
      const merged = mergedOpacityClass(node)
      expect(merged).toContain(expected)
      expect(merged).not.toContain('opacity-[1]')
    }

    it('takes the CSS class leg when the build resolves web legs but is not the web app', () => {
      const { getByTestId, rerender } = render(<GasInfoRow gasInfo={createGasInfo()} />)
      expectOpacityClass(getByTestId(TestID.GasInfoRow), 'opacity-100')

      rerender(<GasInfoRow hidden gasInfo={createGasInfo()} />)
      expectOpacityClass(getByTestId(TestID.GasInfoRow), 'opacity-0')

      rerender(<GasInfoRow gasInfo={createGasInfo({ isLoading: true })} />)
      expectOpacityClass(getByTestId(TestID.GasInfoRow), 'opacity-60')
    })
  })
})
