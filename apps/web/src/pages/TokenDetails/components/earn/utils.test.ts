import { GraphQLApi } from '@universe/api'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { describe, expect, it } from 'vitest'
import { getAggregateTokenBalance } from '~/pages/TokenDetails/components/earn/utils'
import type { MultiChainMap } from '~/pages/TokenDetails/context/TDPContext'

function createBalance(quantity: number, balanceUSD: number | undefined): PortfolioBalance {
  return {
    quantity,
    balanceUSD,
    currencyInfo: undefined,
  } as unknown as PortfolioBalance
}

describe('TokenDetails earn banner utils', () => {
  it('aggregates balances from the Token Details multichain map', () => {
    const multiChainMap = {
      [GraphQLApi.Chain.Ethereum]: { balance: createBalance(100, 100) },
      [GraphQLApi.Chain.Base]: { balance: createBalance(50, undefined) },
    } as MultiChainMap

    const balance = getAggregateTokenBalance(multiChainMap)

    expect(balance?.quantity).toBe(150)
    expect(balance?.balanceUSD).toBe(100)
  })
})
