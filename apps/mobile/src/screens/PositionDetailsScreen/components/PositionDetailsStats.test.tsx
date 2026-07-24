import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionDetailsStats } from 'src/screens/PositionDetailsScreen/components/PositionDetailsStats'
import { render, screen } from 'src/test/test-utils'

const baseProps = {
  status: PositionStatus.IN_RANGE,
  minPrice: '$1,500.00',
  maxPrice: '$2,500.00',
  marketPrice: '$2,000.00',
  aprText: '11.35%',
}

describe('PositionDetailsStats', () => {
  it('shows a single full-range row for V2 positions instead of min/max/market', () => {
    render(<PositionDetailsStats {...baseProps} isV2={true} />)

    expect(screen.getByText('common.range')).toBeDefined()
    expect(screen.getByText('common.fullRange')).toBeDefined()
    expect(screen.queryByText('$1,500.00')).toBeNull()
    expect(screen.queryByText('$2,500.00')).toBeNull()
    expect(screen.queryByText('$2,000.00')).toBeNull()
  })

  it('shows min/max/market rows for concentrated (non-V2) positions', () => {
    render(<PositionDetailsStats {...baseProps} isV2={false} />)

    expect(screen.getByText('$1,500.00')).toBeDefined()
    expect(screen.getByText('$2,500.00')).toBeDefined()
    expect(screen.getByText('$2,000.00')).toBeDefined()
    expect(screen.queryByText('common.fullRange')).toBeNull()
  })
})
