// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { NetworkCostRow } from '@universe/transactions-ui/src/common/NetworkCostRow/NetworkCostRow'
import { describe, expect, it, vi } from 'vitest'

describe('NetworkCostRow', () => {
  it('renders the label and the formatted cost', () => {
    render(<NetworkCostRow value="$1.24" />)
    expect(screen.getByText('gas.override.title')).toBeTruthy()
    expect(screen.getByText('$1.24')).toBeTruthy()
  })

  it('shows a dash while the cost is unknown', () => {
    render(<NetworkCostRow />)
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders the Auto pill only when the cost is on its automatic value', () => {
    const { rerender } = render(<NetworkCostRow isAuto value="$1.24" />)
    expect(screen.getByText('common.auto')).toBeTruthy()
    rerender(<NetworkCostRow value="$1.24" />)
    expect(screen.queryByText('common.auto')).toBeNull()
  })

  it('renders the caption under the row', () => {
    render(<NetworkCostRow caption="Includes smart wallet activation" value="$1.24" />)
    expect(screen.getByText('Includes smart wallet activation')).toBeTruthy()
  })

  it('renders no chevron when display-only', () => {
    const { container } = render(<NetworkCostRow value="$1.24" />)
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })
})
