import { PositionsEmptyFilterView } from 'uniswap/src/features/positions/components/PositionsEmptyFilterView'
import { PositionStatusFilterValue } from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

describe(PositionsEmptyFilterView, () => {
  it('renders the closed no-results view with the view-open CTA', () => {
    const { getByTestId } = render(
      <PositionsEmptyFilterView
        statusFilter={PositionStatusFilterValue.Closed}
        openPositionsCount={3}
        onViewOpenPositions={vi.fn()}
      />,
    )

    expect(getByTestId('pools-empty-filter-view')).toBeTruthy()
    expect(getByTestId('pools-empty-filter-view-cta')).toBeTruthy()
  })

  it('calls onViewOpenPositions when the CTA is pressed', () => {
    const onViewOpenPositions = vi.fn()
    const { getByTestId } = render(
      <PositionsEmptyFilterView
        statusFilter={PositionStatusFilterValue.Closed}
        openPositionsCount={3}
        onViewOpenPositions={onViewOpenPositions}
      />,
    )

    fireEvent.press(getByTestId('pools-empty-filter-view-cta'), ON_PRESS_EVENT_PAYLOAD)

    expect(onViewOpenPositions).toHaveBeenCalledTimes(1)
  })

  it('hides the CTA when there are no open positions to view', () => {
    const { getByTestId, queryByTestId } = render(
      <PositionsEmptyFilterView
        statusFilter={PositionStatusFilterValue.Closed}
        openPositionsCount={0}
        onViewOpenPositions={vi.fn()}
      />,
    )

    expect(getByTestId('pools-empty-filter-view')).toBeTruthy()
    expect(queryByTestId('pools-empty-filter-view-cta')).toBeNull()
  })

  it('renders nothing for non-closed filters', () => {
    const { queryByTestId } = render(
      <PositionsEmptyFilterView
        statusFilter={PositionStatusFilterValue.Open}
        openPositionsCount={3}
        onViewOpenPositions={vi.fn()}
      />,
    )

    expect(queryByTestId('pools-empty-filter-view')).toBeNull()
  })
})
