import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { fireEvent, render } from 'test-utils/render'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'

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
})
