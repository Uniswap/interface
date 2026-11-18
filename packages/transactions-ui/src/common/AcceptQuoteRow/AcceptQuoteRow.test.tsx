// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { AcceptQuoteRow } from '@universe/transactions-ui/src/common/AcceptQuoteRow/AcceptQuoteRow'
import { describe, expect, it, vi } from 'vitest'

describe('AcceptQuoteRow', () => {
  it('renders the new amount and change from props alone', () => {
    render(<AcceptQuoteRow changeText="(-0.42%)" value="1,234.56 USDC" onAccept={vi.fn()} />)
    expect(screen.getByText('swap.details.updatedPrice')).toBeTruthy()
    expect(screen.getByText(/1,234\.56 USDC/)).toBeTruthy()
    expect(screen.getByText('(-0.42%)')).toBeTruthy()
  })

  it('calls onAccept once when the button is pressed', () => {
    const onAccept = vi.fn()
    render(<AcceptQuoteRow value="1,234.56 USDC" onAccept={onAccept} />)
    fireEvent.click(screen.getByText('common.button.accept'))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })
})
