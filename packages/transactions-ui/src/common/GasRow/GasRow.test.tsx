// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { GasRow, GasSummary } from '@universe/transactions-ui/src/common/GasRow/GasRow'
import { describe, expect, it, vi } from 'vitest'

describe('GasRow', () => {
  it('renders the leading slot and the gas summary', () => {
    render(
      <GasRow
        expanded={false}
        gasSummary={<GasSummary gasText="$1.24" />}
        leading={<span>rate</span>}
        onExpandedChange={vi.fn()}
      />,
    )
    expect(screen.getByText('rate')).toBeTruthy()
    expect(screen.getByText('$1.24')).toBeTruthy()
  })

  it('reports the next expanded state and leaves the state to the caller', () => {
    const onExpandedChange = vi.fn()
    const { rerender } = render(
      <GasRow expanded={false} gasSummary={<GasSummary gasText="$1.24" />} onExpandedChange={onExpandedChange} />,
    )
    fireEvent.click(screen.getByText('$1.24'))
    expect(onExpandedChange).toHaveBeenLastCalledWith(true)
    rerender(<GasRow expanded gasSummary={<GasSummary gasText="$1.24" />} onExpandedChange={onExpandedChange} />)
    fireEvent.click(screen.getByText('$1.24'))
    expect(onExpandedChange).toHaveBeenLastCalledWith(false)
  })

  it('renders no toggle without a gas summary', () => {
    const onExpandedChange = vi.fn()
    const { container } = render(
      <GasRow expanded={false} leading={<span>rate</span>} onExpandedChange={onExpandedChange} />,
    )
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })

  it('renders the gas summary without a toggle while there is nothing to expand', () => {
    render(<GasRow gasSummary={<GasSummary gasText="$1.24" />} />)
    expect(screen.getByText('$1.24')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders the trailing slot in place of the gas summary and toggle', () => {
    render(
      <GasRow
        expanded={false}
        gasSummary={<GasSummary gasText="$1.24" />}
        trailing={<span>bridge link</span>}
        onExpandedChange={vi.fn()}
      />,
    )
    expect(screen.getByText('bridge link')).toBeTruthy()
    expect(screen.queryByText('$1.24')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('GasSummary', () => {
  it('renders the formatted cost', () => {
    render(<GasSummary gasText="$1.24" />)
    expect(screen.getByText('$1.24')).toBeTruthy()
  })
})
