import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { render } from 'test-utils/render'

const testBadgeData = [{ label: 'test', copyable: true }, { label: 'test2' }]

describe('LiquidityPositionInfoBadges', () => {
  it('should render with default size', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges badges={testBadgeData} size="default" />)
    expect(getByText('test')).toBeInTheDocument()
  })

  it('should render with small size', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges badges={testBadgeData} size="small" />)
    expect(getByText('test')).toBeInTheDocument()
  })

  it('should render with multiple badges', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges badges={testBadgeData} size="default" />)
    expect(getByText('test')).toBeInTheDocument()
    expect(getByText('test2')).toBeInTheDocument()
  })
})
