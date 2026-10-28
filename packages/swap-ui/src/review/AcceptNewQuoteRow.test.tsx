// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AcceptNewQuoteRow } from './AcceptNewQuoteRow'

describe('AcceptNewQuoteRow', () => {
  it('renders the new amount, symbol and percentage from props alone', () => {
    render(<AcceptNewQuoteRow amount="1,234.56" symbol="USDC" percentageDifference="-0.42" onAccept={vi.fn()} />)
    expect(screen.getByText('swap.details.updatedPrice')).toBeTruthy()
    expect(screen.getByText(/1,234\.56 USDC/)).toBeTruthy()
    expect(screen.getByText('(-0.42%)')).toBeTruthy()
  })

  it('calls onAccept once when the button is pressed', () => {
    const onAccept = vi.fn()
    render(<AcceptNewQuoteRow amount="1,234.56" symbol="USDC" percentageDifference="+0.18" onAccept={onAccept} />)
    fireEvent.click(screen.getByText('common.button.accept'))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })
})
