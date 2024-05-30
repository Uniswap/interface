import { Price, WETH9 } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'constants/tokens'
import { fireEvent, render, screen } from 'test-utils/render'

import TradePrice from './TradePrice'

const price = new Price(WETH9[1], USDC_MAINNET, 100000000000, 5)
const zeroedNumeratorPrice = new Price(WETH9[1], USDC_MAINNET, 100000000000, 0)
const zeroedDenominatorPrice = new Price(WETH9[1], USDC_MAINNET, 0, 5)

describe('trade price', () => {
  it('correctly renders the trade price', () => {
    render(<TradePrice price={price} />)

    const tradePriceToggle = screen.getByText('1 USDC = 0.02 WETH') as HTMLButtonElement
    expect(tradePriceToggle).toBeInTheDocument()
    fireEvent.click(tradePriceToggle)
    expect(screen.getByText('1 WETH = 50.0 USDC')).toBeInTheDocument()
  })

  it('handles zeroed numerator', () => {
    render(<TradePrice price={zeroedNumeratorPrice} />)

    const tradePriceToggle = screen.getByText('1 USDC = 0 WETH') as HTMLButtonElement
    expect(tradePriceToggle).toBeInTheDocument()
    fireEvent.click(tradePriceToggle)
    expect(screen.getByText('1 WETH = 0 USDC')).toBeInTheDocument()
  })

  it('handles zeroed denominator', () => {
    render(<TradePrice price={zeroedDenominatorPrice} />)

    const tradePriceToggle = screen.getByText('1 USDC = 0 WETH') as HTMLButtonElement
    expect(tradePriceToggle).toBeInTheDocument()
    fireEvent.click(tradePriceToggle)
    expect(screen.getByText('1 WETH = 0 USDC')).toBeInTheDocument()
  })
})
