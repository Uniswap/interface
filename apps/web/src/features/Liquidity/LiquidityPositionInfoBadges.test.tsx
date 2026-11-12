import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { buildHookRegistryMap, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { shortenAddress } from 'utilities/src/addresses'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/poolHooks/hooks/useHookRegistryMap', async () => {
  const actual = await vi.importActual('uniswap/src/features/poolHooks/hooks/useHookRegistryMap')
  return {
    ...actual,
    useHookRegistryMap: vi.fn(),
  }
})

// Passthrough spy: real engine behavior, observable inputs/outputs.
vi.mock('uniswap/src/features/fees/getFeeBreakdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/fees/getFeeBreakdown')>()
  return { ...actual, getFeeBreakdown: vi.fn(actual.getFeeBreakdown) }
})

const hookAddress = '0x0010d0d5db05933fa0d9f7038d365e1541a41888'

function mockRegistryWithHook() {
  mocked(useHookRegistryMap).mockReturnValue(
    buildHookRegistryMap(
      new HookListResponse({
        hooks: [
          new HookEntry({
            address: hookAddress,
            chain: 'Ethereum',
            chainId: 1,
            name: 'TestHook',
            description: 'Adjusts LP fees dynamically',
          }),
        ],
      }),
    ),
  )
}

describe('LiquidityPositionInfoBadges', () => {
  it('should render with default size', () => {
    const { getByText } = render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V2}
        feeTier={{ feeAmount: 100, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
        size="default"
      />,
    )
    expect(getByText('v2')).toBeInTheDocument()
  })

  it('should render with small size', () => {
    const { getByText } = render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V2}
        feeTier={{ feeAmount: 100, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
        size="small"
      />,
    )
    expect(getByText('v2')).toBeInTheDocument()
  })

  // `compact` is defined as "`small`'s type size, but tighter chip padding", so it is only meaningful
  // relative to the other two sizes. Comparing the emitted style classes pins both halves of that
  // definition without hard-coding any one styling system's generated class names.
  function renderBadgeChip(size: 'default' | 'small' | 'compact'): { fontSize: string; padding: string[] } {
    const { getByText, unmount } = render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V2}
        feeTier={{ feeAmount: 100, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
        size={size}
      />,
    )
    // The label's own font size comes from the `size === 'default' ? 'body3' : 'body4'` ternary on the
    // inner Text; the chip padding comes from the styled `size` variant. They are two separate
    // mechanisms, so read each from the element that actually carries it.
    const label = getByText('v2')
    const chip = label.parentElement
    if (!chip) {
      throw new Error('badge chip not found')
    }
    const fontSize = label.className.split(' ').find((c) => c.startsWith('text-['))
    const padding = chip.className
      .split(' ')
      .filter((c) => /^p[xytbrl]?-\[/.test(c))
      .sort()
    const labelClassName = label.className
    unmount()
    if (!fontSize) {
      throw new Error(`no font size class for size=${size} on "${labelClassName}"`)
    }
    return { fontSize, padding }
  }

  it('should render with compact size: small type with tighter chip padding', () => {
    const compact = renderBadgeChip('compact')
    const small = renderBadgeChip('small')
    const defaultSize = renderBadgeChip('default')

    // compact shares `small`'s smaller type...
    expect(compact.fontSize).toBe(small.fontSize)
    expect(compact.fontSize).not.toBe(defaultSize.fontSize)
    // ...but tightens the chip padding, which `small` leaves at the default.
    expect(small.padding).toEqual(defaultSize.padding)
    expect(compact.padding).not.toEqual(small.padding)
  })

  it('should render with multiple badges', () => {
    const { getByText } = render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V2}
        feeTier={{ feeAmount: 100, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
        size="default"
      />,
    )
    expect(getByText('v2')).toBeInTheDocument()
    expect(getByText('0.01%')).toBeInTheDocument()
  })

  it('should render with cta', () => {
    const onPressSpy = vi.fn()

    const { getByText } = render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V3}
        feeTier={{ feeAmount: 100, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
        size="default"
        cta={{
          label: 'Migrate to V4',
          onPress: onPressSpy,
        }}
      />,
    )
    expect(getByText('v3')).toBeInTheDocument()
    expect(getByText('0.01%')).toBeInTheDocument()
    expect(getByText('Migrate to V4')).toBeInTheDocument()
    fireEvent.click(getByText('Migrate to V4'))
    expect(onPressSpy).toHaveBeenCalled()
  })

  it('should render the shortened address for a hook not in the registry', () => {
    mockRegistryWithHook()
    const unknownHook = '0x00b2d5db05933fa0d9f7038d365e1541a4144444'
    const { getByText } = render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V4}
        v4hook={unknownHook}
        chainId={UniverseChainId.Mainnet}
        size="default"
      />,
    )
    expect(getByText(shortenAddress({ address: unknownHook }))).toBeInTheDocument()
  })

  it('should render the shortened address when no chainId is provided', () => {
    mockRegistryWithHook()
    const { getByText } = render(
      <LiquidityPositionInfoBadges version={ProtocolVersion.V4} v4hook={hookAddress} size="default" />,
    )
    expect(getByText(shortenAddress({ address: hookAddress }))).toBeInTheDocument()
    // No chain to scope to: falls back to the cross-chain registry request, but disabled since the
    // lookup below can't use it without a chainId.
    expect(mocked(useHookRegistryMap)).toHaveBeenLastCalledWith({ chainId: undefined, enabled: false })
  })

  it('should render the registry name for a known hook and open the details dialog on click', () => {
    mockRegistryWithHook()
    const { getByText } = render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V4}
        v4hook={hookAddress}
        chainId={UniverseChainId.Mainnet}
        size="default"
      />,
    )
    expect(getByText('TestHook')).toBeInTheDocument()
    expect(screen.queryByText('Adjusts LP fees dynamically')).toBeNull()
    fireEvent.click(getByText('TestHook'))
    expect(screen.getByText('Adjusts LP fees dynamically')).toBeTruthy()
    // Single-chain caller: the registry request is scoped to that chain, not fetched cross-chain.
    expect(mocked(useHookRegistryMap)).toHaveBeenLastCalledWith({ chainId: UniverseChainId.Mainnet, enabled: true })
  })

  it('should not fetch the hook registry for a v2/v3 position (no v4hook) even with a chainId', () => {
    mockRegistryWithHook()
    render(
      <LiquidityPositionInfoBadges
        version={ProtocolVersion.V3}
        chainId={UniverseChainId.Mainnet}
        feeTier={{ feeAmount: 100, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
        size="default"
      />,
    )
    // No v4hook to look up: the registry fetch would be wasted, so it stays disabled despite chainId.
    expect(mocked(useHookRegistryMap)).toHaveBeenLastCalledWith({ chainId: UniverseChainId.Mainnet, enabled: false })
  })

  describe('fee badge', () => {
    it('renders a FeeDisplay for a static v4 fee tier', () => {
      const { getByText } = render(
        <LiquidityPositionInfoBadges
          version={ProtocolVersion.V4}
          feeTier={{ feeAmount: 3000, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
          size="default"
        />,
      )
      expect(getByText('v4')).toBeInTheDocument()
      // Without a served protocol fee the badge is just the plain fee label — no hover breakdown.
      expect(getByText('0.3%')).toBeInTheDocument()
    })

    it('keeps the Dynamic label for dynamic fee tiers instead of rendering the sentinel as a fee', () => {
      const { getByText } = render(
        <LiquidityPositionInfoBadges
          version={ProtocolVersion.V4}
          feeTier={{ feeAmount: DYNAMIC_FEE_AMOUNT, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: true }}
          size="default"
        />,
      )
      expect(getByText('Dynamic')).toBeInTheDocument()
      // DYNAMIC_FEE_AMOUNT (8388608 pips) must never be formatted as a rate (~838%).
      expect(screen.queryByText(/838/)).toBeNull()
    })

    it('shows the served current fee for a dynamic fee tier', () => {
      render(
        <LiquidityPositionInfoBadges
          version={ProtocolVersion.V4}
          feeTier={{ feeAmount: DYNAMIC_FEE_AMOUNT, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: true }}
          // 7000 pips = 0.7%, what the pool's latest swap charged.
          currentLpFeePips={7000}
          size="default"
        />,
      )
      expect(screen.getByText('0.70%')).toBeInTheDocument()
      expect(screen.queryByText('Dynamic')).toBeNull()
      expect(screen.queryByText(/838/)).toBeNull()
    })

    it('renders the fixed v2 fee fallback', () => {
      const { getByText } = render(<LiquidityPositionInfoBadges version={ProtocolVersion.V2} size="default" />)
      expect(getByText('v2')).toBeInTheDocument()
      expect(getByText('0.3%')).toBeInTheDocument()
    })

    it('serves v2 its fixed protocol fee (1/6 of the tier) so the badge gets a breakdown without a caller wiring one in', () => {
      mocked(getFeeBreakdown).mockClear()
      // v2 passes no protocolFeePips (PairPosition has no fee field) → falls back to the constant.
      render(<LiquidityPositionInfoBadges version={ProtocolVersion.V2} size="default" />)
      expect(getFeeBreakdown).toHaveBeenCalledWith(
        expect.objectContaining({ feeAmount: V2_DEFAULT_FEE_TIER, servedProtocolFeeBps: 5 }),
      )
      const result = mocked(getFeeBreakdown).mock.results.at(-1)?.value
      // Subtractive v2: LP keeps 25 bps, protocol takes 5 → tooltip renders.
      expect(result).toMatchObject({ lpFeeBps: 25, protocolFeeBps: 5, effectiveFeeBps: 30 })
    })

    it('feeds the backend-served protocol fee (pips) to the engine as bps and gets a served breakdown', () => {
      mocked(getFeeBreakdown).mockClear()
      render(
        <LiquidityPositionInfoBadges
          version={ProtocolVersion.V4}
          feeTier={{ feeAmount: 3000, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
          // 500 pips = 5 bps, served by data-api (backend#10486).
          protocolFeePips={500}
          size="default"
        />,
      )
      expect(getFeeBreakdown).toHaveBeenCalledWith(
        expect.objectContaining({ feeAmount: 3000, servedProtocolFeeBps: 5 }),
      )
      const served = mocked(getFeeBreakdown)
        .mock.results.map((result) => result.value)
        .find((breakdown) => breakdown.protocolFeeBps !== undefined)
      // The served value wins: 30 LP + 5 protocol = 35 effective, no unavailable fallback.
      expect(served).toMatchObject({ lpFeeBps: 30, protocolFeeBps: 5, effectiveFeeBps: 35 })
    })

    it('builds an unavailable breakdown (no tooltip) when the backend serves no protocol fee', () => {
      mocked(getFeeBreakdown).mockClear()
      const { getByText } = render(
        <LiquidityPositionInfoBadges
          version={ProtocolVersion.V4}
          feeTier={{ feeAmount: 3000, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
          size="default"
        />,
      )
      // No served protocol fee → the engine yields an unavailable breakdown (protocolFeeBps undefined),
      // and FeeDisplay drops the tooltip so the badge stays a plain %. (Suppression: FeeDisplay.test.)
      const result = mocked(getFeeBreakdown).mock.results.at(-1)?.value
      expect(result?.protocolFeeBps).toBeUndefined()
      expect(getByText('0.3%')).toBeInTheDocument()
    })
  })
})
