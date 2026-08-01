import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionStatusPill } from 'src/screens/PositionDetailsScreen/components/PositionStatusPill'
import { render, screen } from 'src/test/test-utils'

describe('PositionStatusPill', () => {
  it.each([
    [PositionStatus.IN_RANGE, 'common.withinRange'],
    [PositionStatus.OUT_OF_RANGE, 'common.outOfRange'],
    [PositionStatus.CLOSED, 'common.closed'],
  ])('renders the localized label for status %s', (status, label) => {
    render(<PositionStatusPill status={status} />)

    expect(screen.getByText(label)).toBeDefined()
  })

  it('renders nothing when the status has no config (unspecified)', () => {
    render(<PositionStatusPill status={PositionStatus.UNSPECIFIED} />)

    expect(document.body.textContent).toBe('')
  })
})
