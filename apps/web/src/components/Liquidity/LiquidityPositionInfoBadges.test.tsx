import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { render } from 'test-utils/render'

describe('LiquidityPositionInfoBadges', () => {
  it('should render with default size', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges versionLabel="2" feeTier="100" size="default" />)
    expect(getByText('2')).toBeInTheDocument()
  })

  it('should render with small size', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges versionLabel="2" feeTier="100" size="small" />)
    expect(getByText('2')).toBeInTheDocument()
  })

  it('should render with multiple badges', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges versionLabel="2" feeTier="100" size="default" />)
    expect(getByText('2')).toBeInTheDocument()
    expect(getByText('0.01%')).toBeInTheDocument()
  })
})
