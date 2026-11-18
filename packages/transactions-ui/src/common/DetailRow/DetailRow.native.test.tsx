// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { DetailRow } from '@universe/transactions-ui/src/common/DetailRow/DetailRow'
import { describe, expect, it } from 'vitest'

// Native layout only: web flex items never shrink below their longest word.
describe('DetailRow (native layout)', () => {
  it('keeps the label width when the value fills the row', () => {
    render(<DetailRow fillValue label="Rate" value="1 ETH = 2,320.59 USDC ($2,320.59)" />)
    expect(getComputedStyle(screen.getByText('Rate')).flexShrink).toBe('0')
  })

  it('lets a long label wrap next to a value that sizes to its content', () => {
    render(<DetailRow label="Network cost" value="$0.45" />)
    expect(getComputedStyle(screen.getByText('Network cost')).flexShrink).toBe('1')
  })
})
