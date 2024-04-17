import { MockExpiredUniswapXOrder, MockFilledUniswapXOrder, MockOpenUniswapXOrder } from './fixtures'
import { OrderActivity, parseRemote } from './parseRemote'

describe('parseRemote', () => {
  it('should parse open UniswapX order', () => {
    const result = parseRemote(MockOpenUniswapXOrder as OrderActivity)
    expect(result).toMatchSnapshot()
  })
  it('should parse expired UniswapX order', () => {
    const result = parseRemote(MockExpiredUniswapXOrder as OrderActivity)
    expect(result).toMatchSnapshot()
  })
  it('should parse filledUniswapX order', () => {
    const result = parseRemote(MockFilledUniswapXOrder as OrderActivity)
    expect(result).toMatchSnapshot()
  })
})
