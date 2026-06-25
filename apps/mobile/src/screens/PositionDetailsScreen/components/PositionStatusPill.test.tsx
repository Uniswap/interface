import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionStatusPill } from 'src/screens/PositionDetailsScreen/components/PositionStatusPill'
import { render, screen } from 'src/test/test-utils'

describe('PositionStatusPill', () => {
  it.each([
    [PositionStatus.IN_RANGE, 'In range'],
    [PositionStatus.OUT_OF_RANGE, 'Out of range'],
    [PositionStatus.CLOSED, 'Closed'],
  ])('renders the localized label for status %s', (status, label) => {
    render(<PositionStatusPill status={status} />)

    expect(screen.getByText(label)).toBeDefined()
  })

  it('renders nothing when the status has no config (unspecified)', () => {
    render(<PositionStatusPill status={PositionStatus.UNSPECIFIED} />)

    expect(screen.toJSON()).toBeNull()
  })
})
