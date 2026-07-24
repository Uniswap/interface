import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { shortenAddress } from 'utilities/src/addresses'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { buildHookRegistryMap, useHookRegistryMap } from '~/hooks/useHookRegistryMap'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/hooks/useHookRegistryMap', async () => {
  const actual = await vi.importActual('~/hooks/useHookRegistryMap')
  return {
    ...actual,
    useHookRegistryMap: vi.fn(),
  }
})

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

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
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(false)
  })

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
  })

  describe('with V4ProtocolFeeDisplay enabled', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.V4ProtocolFeeDisplay)
    })

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
