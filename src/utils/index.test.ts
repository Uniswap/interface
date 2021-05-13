import { BigNumber } from '@ethersproject/bignumber'
import { AddressZero } from '@ethersproject/constants'
import { CurrencyAmount, Token, ChainId, Percent } from '@uniswap/sdk-core'
import { getEtherscanLink, calculateSlippageAmount, isAddress, shortenAddress, calculateGasMargin } from '.'

describe('utils', () => {
  describe('#getEtherscanLink', () => {
    it('correct for tx', () => {
      expect(getEtherscanLink(1, 'abc', 'transaction')).toEqual('https://etherscan.io/tx/abc')
    })
    it('correct for token', () => {
      expect(getEtherscanLink(1, 'abc', 'token')).toEqual('https://etherscan.io/token/abc')
    })
    it('correct for address', () => {
      expect(getEtherscanLink(1, 'abc', 'address')).toEqual('https://etherscan.io/address/abc')
    })
    it('unrecognized chain id defaults to mainnet', () => {
      expect(getEtherscanLink(2, 'abc', 'address')).toEqual('https://etherscan.io/address/abc')
    })
    it('ropsten', () => {
      expect(getEtherscanLink(3, 'abc', 'address')).toEqual('https://ropsten.etherscan.io/address/abc')
    })
    it('enum', () => {
      expect(getEtherscanLink(ChainId.RINKEBY, 'abc', 'address')).toEqual('https://rinkeby.etherscan.io/address/abc')
    })
  })

  describe('#calculateSlippageAmount', () => {
    it('bounds are correct', () => {
      const tokenAmount = CurrencyAmount.fromRawAmount(new Token(ChainId.MAINNET, AddressZero, 0), '100')
      expect(() => calculateSlippageAmount(tokenAmount, new Percent(-1, 10_000))).toThrow('Unexpected slippage')
      expect(() => calculateSlippageAmount(tokenAmount, new Percent(10_001, 10_000))).toThrow('Unexpected slippage')
      expect(calculateSlippageAmount(tokenAmount, new Percent(0, 10_000)).map((bound) => bound.toString())).toEqual([
        '100',
        '100',
      ])
      expect(calculateSlippageAmount(tokenAmount, new Percent(5, 100)).map((bound) => bound.toString())).toEqual([
        '95',
        '105',
      ])
      expect(calculateSlippageAmount(tokenAmount, new Percent(100, 10_000)).map((bound) => bound.toString())).toEqual([
        '99',
        '101',
      ])
      expect(calculateSlippageAmount(tokenAmount, new Percent(200, 10_000)).map((bound) => bound.toString())).toEqual([
        '98',
        '102',
      ])
      expect(
        calculateSlippageAmount(tokenAmount, new Percent(10000, 10_000)).map((bound) => bound.toString())
      ).toEqual(['0', '200'])
    })
    it('works for 18 decimals', () => {
      const tokenAmount = CurrencyAmount.fromRawAmount(new Token(ChainId.MAINNET, AddressZero, 18), '100')
      expect(() => calculateSlippageAmount(tokenAmount, new Percent(-1, 10_000))).toThrow('Unexpected slippage')
      expect(() => calculateSlippageAmount(tokenAmount, new Percent(10_001, 10_000))).toThrow('Unexpected slippage')
      expect(calculateSlippageAmount(tokenAmount, new Percent(0, 10_000)).map((bound) => bound.toString())).toEqual([
        '100',
        '100',
      ])
      expect(calculateSlippageAmount(tokenAmount, new Percent(5, 100)).map((bound) => bound.toString())).toEqual([
        '95',
        '105',
      ])
      expect(calculateSlippageAmount(tokenAmount, new Percent(100, 10_000)).map((bound) => bound.toString())).toEqual([
        '99',
        '101',
      ])
      expect(calculateSlippageAmount(tokenAmount, new Percent(200, 10_000)).map((bound) => bound.toString())).toEqual([
        '98',
        '102',
      ])
      expect(
        calculateSlippageAmount(tokenAmount, new Percent(10000, 10_000)).map((bound) => bound.toString())
      ).toEqual(['0', '200'])
    })
  })

  describe('#isAddress', () => {
    it('returns false if not', () => {
      expect(isAddress('')).toBe(false)
      expect(isAddress('0x0000')).toBe(false)
      expect(isAddress(1)).toBe(false)
      expect(isAddress({})).toBe(false)
      expect(isAddress(undefined)).toBe(false)
    })

    it('returns the checksummed address', () => {
      expect(isAddress('0xf164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')
      expect(isAddress('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')).toBe('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')
    })

    it('succeeds even without prefix', () => {
      expect(isAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')
    })
    it('fails if too long', () => {
      expect(isAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a0')).toBe(false)
    })
  })

  describe('#shortenAddress', () => {
    it('throws on invalid address', () => {
      expect(() => shortenAddress('abc')).toThrow("Invalid 'address'")
    })

    it('truncates middle characters', () => {
      expect(shortenAddress('0xf164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164...b92a')
    })

    it('truncates middle characters even without prefix', () => {
      expect(shortenAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164...b92a')
    })

    it('renders checksummed address', () => {
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC'.toLowerCase())).toBe('0x2E1b...54CC')
    })
  })

  describe('#calculateGasMargin', () => {
    it('adds 20%', () => {
      expect(calculateGasMargin(BigNumber.from(1000)).toString()).toEqual('1200')
      expect(calculateGasMargin(BigNumber.from(50)).toString()).toEqual('60')
    })
  })
})
