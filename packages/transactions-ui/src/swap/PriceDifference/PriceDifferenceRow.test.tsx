// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import {
  PriceDifferenceLabel,
  PriceDifferenceRow,
} from '@universe/transactions-ui/src/swap/PriceDifference/PriceDifferenceRow'
import { describe, expect, it } from 'vitest'

describe('PriceDifferenceRow', () => {
  it('renders the value and the label slot', () => {
    render(<PriceDifferenceRow value="3.21%" warning={{ severity: 'medium' }} label={<span>label slot</span>} />)
    expect(screen.getByText('3.21%')).toBeTruthy()
    expect(screen.getByText('label slot')).toBeTruthy()
  })

  it('renders the label copy from the package', () => {
    render(<PriceDifferenceLabel />)
    expect(screen.getByText('swap.priceImpact')).toBeTruthy()
  })
})
