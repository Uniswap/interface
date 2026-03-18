import { sortBalancesByName } from 'uniswap/src/features/dataApi/balances/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'

describe('sortBalancesByName', () => {
  it('returns an empty array when input is undefined', () => {
    expect(sortBalancesByName(undefined)).toEqual([])
  })

  it('returns an empty array when input is an empty array', () => {
    expect(sortBalancesByName([])).toEqual([])
  })

  it('sorts balances by currency name', () => {
    const unsortedBalances = [
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: 'Cardano' } } },
    ] as PortfolioBalance[]

    const sortedBalances = sortBalancesByName(unsortedBalances)

    expect(sortedBalances).toEqual([
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Cardano' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
    ])
  })

  it('handles balances with missing or empty names', () => {
    const unsortedBalances = [
      { currencyInfo: { currency: { name: '' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: null } } },
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
    ] as PortfolioBalance[]

    const sortedBalances = sortBalancesByName(unsortedBalances)

    expect(sortedBalances).toEqual([
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: '' } } },
      { currencyInfo: { currency: { name: null } } },
    ])
  })

  it('places balances with missing names at the end', () => {
    const unsortedBalances = [
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: null } } },
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: '' } } },
    ] as PortfolioBalance[]

    const sortedBalances = sortBalancesByName(unsortedBalances)

    expect(sortedBalances).toEqual([
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: null } } },
      { currencyInfo: { currency: { name: '' } } },
    ])
  })
})
