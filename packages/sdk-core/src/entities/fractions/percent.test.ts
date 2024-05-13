import { Percent } from './percent'

describe('Percent', () => {
  describe('constructor', () => {
    it('defaults to 1 denominator', () => {
      expect(new Percent(1)).toEqual(new Percent(1, 1))
    })
  })
  describe('#add', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).add(new Percent(2, 100))).toEqual(new Percent(3, 100))
    })
    it('different denominators', () => {
      expect(new Percent(1, 25).add(new Percent(2, 100))).toEqual(new Percent(150, 2500))
    })
  })
  describe('#subtract', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).subtract(new Percent(2, 100))).toEqual(new Percent(-1, 100))
    })
    it('different denominators', () => {
      expect(new Percent(1, 25).subtract(new Percent(2, 100))).toEqual(new Percent(50, 2500))
    })
  })
  describe('#multiply', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).multiply(new Percent(2, 100))).toEqual(new Percent(2, 10000))
    })
    it('different denominators', () => {
      expect(new Percent(1, 25).multiply(new Percent(2, 100))).toEqual(new Percent(2, 2500))
    })
  })
  describe('#divide', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).divide(new Percent(2, 100))).toEqual(new Percent(100, 200))
    })
    it('different denominators', () => {
      expect(new Percent(1, 25).divide(new Percent(2, 100))).toEqual(new Percent(100, 50))
    })
  })

  describe('#toSignificant', () => {
    it('returns the value scaled by 100', () => {
      expect(new Percent(154, 10_000).toSignificant(3)).toEqual('1.54')
    })
  })
  describe('#toFixed', () => {
    it('returns the value scaled by 100', () => {
      expect(new Percent(154, 10_000).toFixed(2)).toEqual('1.54')
    })
  })
})
