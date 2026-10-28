// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RateRow } from './RateRow'

const rate = {
  rate: '1 UNI = 0.0031 ETH',
  rateUsd: '$12.94',
  invertedRate: '1 ETH = 322.58 UNI',
  invertedRateUsd: '$3,170.00',
}

describe('RateRow', () => {
  it('renders the label and the rate', () => {
    render(<RateRow rate={rate} />)
    expect(screen.getByText('swap.details.rate')).toBeTruthy()
    expect(screen.getByText('1 UNI = 0.0031 ETH')).toBeTruthy()
  })

  it('inverts on press through RateRatio', () => {
    render(<RateRow rate={rate} />)
    fireEvent.click(screen.getByText('1 UNI = 0.0031 ETH'))
    expect(screen.getByText('1 ETH = 322.58 UNI')).toBeTruthy()
  })
})
