import { Percent } from '@uniswap/sdk-core'

import { largerPercentValue } from './percent'

describe('largerPercentValue', () => {
  it('should return the larger percent value', () => {
    expect(largerPercentValue(new Percent(100, 1000), new Percent(200, 1000))).toEqual(new Percent(200, 1000))
  })

  it('should return the first percent value if the second is undefined', () => {
    expect(largerPercentValue(new Percent(100, 1000), undefined)).toEqual(new Percent(100, 1000))
  })

  it('should return the second percent value if the first is undefined', () => {
    expect(largerPercentValue(undefined, new Percent(100, 1000))).toEqual(new Percent(100, 1000))
  })

  it('should return undefined if both percent values are undefined', () => {
    expect(largerPercentValue(undefined, undefined)).toEqual(undefined)
  })

  it('should return first if both percent values are equal', () => {
    expect(largerPercentValue(new Percent(100, 1000), new Percent(100, 1000))).toEqual(new Percent(100, 1000))
  })
})
