import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { render } from 'test-utils/render'
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
})
