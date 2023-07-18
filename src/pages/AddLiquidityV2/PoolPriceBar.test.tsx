import { Price, WETH9 } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'constants/tokens'
import { Field } from 'state/mint/actions'
import { render, screen } from 'test-utils/render'

import { PoolPriceBar } from './PoolPriceBar'

const currencies = {
  [Field.CURRENCY_A]: WETH9[1],
  [Field.CURRENCY_B]: USDC_MAINNET,
}

const price = new Price(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B], 1234, 1)

describe('pool price bar', () => {
  it('correctly renders the correct pool prices', () => {
    render(<PoolPriceBar currencies={currencies} price={price} noLiquidity={false} poolTokenPercentage={undefined} />)

    expect(screen.getByTestId('currency-b-price').textContent).toBe('810373000')
    expect(screen.getByTestId('currency-a-price').textContent).toBe('0.000000001234')
  })

  it('handles undefined price', () => {
    render(
      <PoolPriceBar currencies={currencies} price={undefined} noLiquidity={false} poolTokenPercentage={undefined} />
    )

    expect(screen.getByTestId('currency-b-price').textContent).toBe('-')
    expect(screen.getByTestId('currency-a-price').textContent).toBe('-')
  })
})
