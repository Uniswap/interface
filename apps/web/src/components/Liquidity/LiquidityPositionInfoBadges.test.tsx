import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { render } from 'test-utils/render'

describe('LiquidityPositionInfoBadges', () => {
  it('should render with default size', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges labels={['test']} size="default" />)
    expect(getByText('test')).toBeInTheDocument()
  })

  it('should render with small size', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges labels={['test']} size="small" />)
    expect(getByText('test')).toBeInTheDocument()
  })

  it('should render with multiple labels', () => {
    const { getByText } = render(<LiquidityPositionInfoBadges labels={['test', 'test2']} size="default" />)
    expect(getByText('test')).toBeInTheDocument()
    expect(getByText('test2')).toBeInTheDocument()
  })
})
