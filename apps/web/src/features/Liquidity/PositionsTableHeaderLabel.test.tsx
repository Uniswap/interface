import { describe, expect, it, vi } from 'vitest'
import { HeaderLabel } from '~/features/Liquidity/PositionsTableHeaderLabel'
import { render, screen } from '~/test-utils/render'

function getHeaderCell(label: HTMLElement): HTMLElement {
  const cell = label.parentElement
  if (!cell) {
    throw new Error('header label has no cell')
  }
  return cell
}

describe('HeaderLabel', () => {
  it('keeps a plain header label on one line', () => {
    render(<HeaderLabel id="pool" align="flex-start" />)

    const label = screen.getByText('Pool')
    expect(label.className).toContain('whitespace-nowrap')
    expect(label.className).toContain('text-ellipsis')
  })

  it('drops the cell right padding only when asked', () => {
    const { unmount } = render(<HeaderLabel id="pool" align="flex-start" noTrailingPadding />)
    const flushCell = getHeaderCell(screen.getByText('Pool'))
    expect(flushCell.className).toMatch(/(^|\s)pr-\[0px\](\s|$)/)
    unmount()

    render(<HeaderLabel id="pool" align="flex-start" />)
    const paddedCell = getHeaderCell(screen.getByText('Pool'))
    expect(paddedCell.className).not.toMatch(/(^|\s)pr-\[0px\](\s|$)/)
  })

  it('renders a sortable header as a pressable, single-line label', () => {
    const onSort = vi.fn()
    render(<HeaderLabel id="liquidity" align="flex-end" sortField="liquidity" onSort={onSort} />)

    const label = screen.getByText('Value')
    expect(label.className).toContain('whitespace-nowrap')
    label.click()
    expect(onSort).toHaveBeenCalledWith('liquidity')
  })
})
