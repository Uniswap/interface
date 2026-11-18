// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { ExchangeRate } from '@universe/transactions-ui/src/common/ExchangeRate/ExchangeRate'
import type { RateDisplay } from '@universe/transactions-ui/src/common/types'
import { describe, expect, it } from 'vitest'

const rate: RateDisplay = {
  rate: '1 ETH = 3,241.20 USDC',
  rateUsd: '$3,240.11',
  invertedRate: '1 USDC = 0.000309 ETH',
  invertedRateUsd: '$1.00',
}

describe('ExchangeRate', () => {
  it('starts in the direction defaultInverted selects', () => {
    render(<ExchangeRate defaultInverted rate={rate} />)
    expect(screen.getByText('1 USDC = 0.000309 ETH')).toBeTruthy()
    expect(screen.getByText('($1.00)')).toBeTruthy()
  })

  it('flips direction on press', () => {
    render(<ExchangeRate rate={rate} />)
    fireEvent.click(screen.getByText('1 ETH = 3,241.20 USDC'))
    expect(screen.getByText('1 USDC = 0.000309 ETH')).toBeTruthy()
  })

  it('still renders the abbreviated rate when a full-precision value is attached for the tooltip', () => {
    render(<ExchangeRate rate={{ ...rate, fullPrecisionRate: '1 ETH = 3,241.2019 USDC' }} />)
    expect(screen.getByText('1 ETH = 3,241.20 USDC')).toBeTruthy()
  })

  it('omits the fiat part when the price is unknown', () => {
    render(<ExchangeRate rate={{ ...rate, rateUsd: undefined, invertedRateUsd: undefined }} />)
    expect(screen.queryByText(/\(\$/)).toBeNull()
  })
})
