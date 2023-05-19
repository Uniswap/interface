import { Percent } from '@uniswap/sdk-core'

import formatPriceImpact from './formatPriceImpact'

describe('formatPriceImpact', () => {
  it('formats price impact', () => {
    expect(formatPriceImpact(new Percent(5, 10_000))).toEqual('-0.05%')
  })
  // While there's theoretically no such thing as "positive price impact", this can show up
  // due to a bug in routing-api, so it's still tested for
  it('formats price impact when given a negative value', () => {
    expect(formatPriceImpact(new Percent(-5, 10_000))).toEqual('0.05%')
  })
})
