import { Percent } from "@uniswap/sdk-core"
import formatPriceImpact from "./formatPriceImpact"

describe('formatPriceImpact', () => {
  it('formats positive price impact', () => {
    expect(formatPriceImpact(new Percent(5, 10_000))).toEqual('-0.05%')
  })
  it('formats negative price impact', () => {
    expect(formatPriceImpact(new Percent(-5, 10_000))).toEqual('0.05%')
  })
})
