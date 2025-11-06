import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { LiquidityPositionStatusIndicator } from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { render } from 'test-utils/render'

describe('LiquidityPositionStatusIndicator', () => {
  it('should say in range', () => {
    const { getByText } = render(<LiquidityPositionStatusIndicator status={PositionStatus.IN_RANGE} />)
    expect(getByText('In range')).toBeInTheDocument()
  })
  it('should say out of range', () => {
    const { getByText } = render(<LiquidityPositionStatusIndicator status={PositionStatus.OUT_OF_RANGE} />)
    expect(getByText('Out of range')).toBeInTheDocument()
  })
  it('should say closed', () => {
    const { getByText } = render(<LiquidityPositionStatusIndicator status={PositionStatus.CLOSED} />)
    expect(getByText('Closed')).toBeInTheDocument()
  })
  it('should not render if status is unspecified', () => {
    const { container } = render(<LiquidityPositionStatusIndicator status={PositionStatus.UNSPECIFIED} />)
    expect(container).not.toHaveTextContent('In range')
    expect(container).not.toHaveTextContent('Out of range')
    expect(container).not.toHaveTextContent('Closed')
  })
})
