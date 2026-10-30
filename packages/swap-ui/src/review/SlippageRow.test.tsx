// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SlippageRow, SlippageRowLabel } from './SlippageRow'

const slippage = { tolerance: '0.50%', isZero: false, isCustom: false, exceedsAuto: false }

describe('SlippageRow', () => {
  it('renders the label slot, the Auto pill and the tolerance', () => {
    render(<SlippageRow label={<span>label slot</span>} slippage={slippage} />)
    expect(screen.getByText('label slot')).toBeTruthy()
    expect(screen.getByText('swap.settings.slippage.control.auto')).toBeTruthy()
    expect(screen.getByText('0.50%')).toBeTruthy()
  })

  it('drops the Auto pill for custom slippage', () => {
    render(<SlippageRow label={null} slippage={{ ...slippage, isCustom: true }} />)
    expect(screen.queryByText('swap.settings.slippage.control.auto')).toBeNull()
  })

  it('renders None when the tolerance is zero', () => {
    render(<SlippageRow label={null} slippage={{ ...slippage, isZero: true, tolerance: '0.00%' }} />)
    expect(screen.getByText('common.none')).toBeTruthy()
    expect(screen.queryByText('0.00%')).toBeNull()
  })

  it('hides the value while loading', () => {
    render(<SlippageRow label={null} slippage={slippage} isLoading />)
    expect(screen.queryByText('0.50%')).toBeNull()
  })
})

describe('SlippageRowLabel', () => {
  it('reads Max slippage by default and Total slippage for chained trades', () => {
    const { unmount } = render(<SlippageRowLabel isChained={false} />)
    expect(screen.getByText('swap.details.slippage')).toBeTruthy()
    unmount()
    render(<SlippageRowLabel isChained />)
    expect(screen.getByText('swap.details.slippage.total')).toBeTruthy()
  })
})
