// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RateRatio } from './RateRatio'

const rate = {
  rate: '1 UNI = 0.0031 ETH',
  rateUsd: '$12.94',
  invertedRate: '1 ETH = 322.58 UNI',
  invertedRateUsd: '$3,170.00',
}

describe('RateRatio', () => {
  it('renders the rate and its fiat value from props alone', () => {
    render(<RateRatio rate={rate} />)
    expect(screen.getByText('1 UNI = 0.0031 ETH')).toBeTruthy()
    expect(screen.getByText('($12.94)')).toBeTruthy()
  })

  it('starts inverted when asked', () => {
    render(<RateRatio rate={rate} initialInverse />)
    expect(screen.getByText('1 ETH = 322.58 UNI')).toBeTruthy()
    expect(screen.getByText('($3,170.00)')).toBeTruthy()
  })

  it('toggles orientation on press', () => {
    render(<RateRatio rate={rate} />)
    fireEvent.click(screen.getByText('1 UNI = 0.0031 ETH'))
    expect(screen.getByText('1 ETH = 322.58 UNI')).toBeTruthy()
  })

  it('still renders the abbreviated rate when a full-precision value is attached for the tooltip', () => {
    render(<RateRatio rate={{ ...rate, fullPrecisionRate: '1 UNI = 0.003100000 ETH' }} />)
    expect(screen.getByText('1 UNI = 0.0031 ETH')).toBeTruthy()
  })

  it('omits the fiat parenthetical when there is none', () => {
    render(<RateRatio rate={{ rate: rate.rate, invertedRate: rate.invertedRate }} />)
    expect(screen.queryByText(/\(/)).toBeNull()
  })
})
