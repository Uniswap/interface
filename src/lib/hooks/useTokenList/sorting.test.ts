import { CurrencyAmount } from '@uniswap/sdk-core'
import { DAI, FRAX, WBTC } from 'constants/tokens'

import { tokenComparator } from './sorting'

describe('tokenComparator', () => {
  it('sorts tokens by USD value (descending)', () => {
    const result = tokenComparator(
      {
        // Balances
        [DAI.address]: CurrencyAmount.fromRawAmount(DAI, 1),
        [WBTC.address]: CurrencyAmount.fromRawAmount(WBTC, 1),
      },
      {
        // Prices
        [DAI.address]: 1,
        [WBTC.address]: 1000000,
      },
      DAI,
      WBTC
    )
    expect(result).toBe(1) // tokenB has a higher USD value than tokenA, while balances are equal
  })

  it('sorts tokens by currency amount (descending)', () => {
    const result = tokenComparator(
      {
        // Balances
        [FRAX.address]: CurrencyAmount.fromFractionalAmount(FRAX, 1, 10),
        [DAI.address]: CurrencyAmount.fromRawAmount(DAI, 1),
      },
      {
        // Prices
        [FRAX.address]: 1,
        [DAI.address]: 1,
      },
      FRAX,
      DAI
    )
    expect(result).toBe(1) // tokenB has a higher balance amount than tokenA, while USD values are equal
  })

  it('sorts tokens by symbol (ascending)', () => {
    const result = tokenComparator(
      {
        // Balances
        [FRAX.address]: CurrencyAmount.fromFractionalAmount(FRAX, 1, 10),
        [DAI.address]: CurrencyAmount.fromRawAmount(DAI, 1),
      },
      {
        // Prices
        [FRAX.address]: 1,
        [DAI.address]: 1,
      },
      FRAX,
      DAI
    )
    expect(result).toBe(1) // tokenB is before tokenA alphabetically
  })
})
