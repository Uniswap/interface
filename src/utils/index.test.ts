import { BigNumber } from '@ethersproject/bignumber'
import { AddressZero } from '@ethersproject/constants'
import { TokenAmount, Token, ChainId, Percent, JSBI } from '@fuseio/fuse-swap-sdk'

import {
  getExplorerLink,
  calculateSlippageAmount,
  isAddress,
  shortenAddress,
  calculateGasMargin,
  basisPointsToPercent,
  isCustomBridgeToken,
  getForeignCustomBridgeAddress,
  getHomeCustomBridgeAddress
} from '.'

describe('utils', () => {
  describe('#getExplorerLink', () => {
    it('correct for tx', () => {
      expect(getExplorerLink(1, 'abc', 'transaction')).toEqual('https://etherscan.io/tx/abc')
    })
    it('correct for token', () => {
      expect(getExplorerLink(1, 'abc', 'token')).toEqual('https://etherscan.io/token/abc')
    })
    it('correct for address', () => {
      expect(getExplorerLink(1, 'abc', 'address')).toEqual('https://etherscan.io/address/abc')
    })
    it('unrecognized chain id defaults to mainnet', () => {
      expect(getExplorerLink(2, 'abc', 'address')).toEqual('https://etherscan.io/address/abc')
    })
    it('ropsten', () => {
      expect(getExplorerLink(3, 'abc', 'address')).toEqual('https://ropsten.etherscan.io/address/abc')
    })
    it('enum', () => {
      expect(getExplorerLink(ChainId.RINKEBY, 'abc', 'address')).toEqual('https://rinkeby.etherscan.io/address/abc')
    })
  })

  describe('#calculateSlippageAmount', () => {
    it('bounds are correct', () => {
      const tokenAmount = new TokenAmount(new Token(ChainId.MAINNET, AddressZero, 0), '100')
      expect(() => calculateSlippageAmount(tokenAmount, -1)).toThrow()
      expect(calculateSlippageAmount(tokenAmount, 0).map(bound => bound.toString())).toEqual(['100', '100'])
      expect(calculateSlippageAmount(tokenAmount, 100).map(bound => bound.toString())).toEqual(['99', '101'])
      expect(calculateSlippageAmount(tokenAmount, 200).map(bound => bound.toString())).toEqual(['98', '102'])
      expect(calculateSlippageAmount(tokenAmount, 10000).map(bound => bound.toString())).toEqual(['0', '200'])
      expect(() => calculateSlippageAmount(tokenAmount, 10001)).toThrow()
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
    it('adds 10%', () => {
      expect(calculateGasMargin(BigNumber.from(1000)).toString()).toEqual('1100')
      expect(calculateGasMargin(BigNumber.from(50)).toString()).toEqual('55')
    })
  })

  describe('#basisPointsToPercent', () => {
    it('converts basis points numbers to percents', () => {
      expect(basisPointsToPercent(100).equalTo(new Percent(JSBI.BigInt(1), JSBI.BigInt(100)))).toBeTruthy()
      expect(basisPointsToPercent(500).equalTo(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toBeTruthy()
      expect(basisPointsToPercent(50).equalTo(new Percent(JSBI.BigInt(5), JSBI.BigInt(1000)))).toBeTruthy()
    })
  })

  describe('#isCustomBridgeToken', () => {
    it('returns true when home address is included', () => {
      expect(isCustomBridgeToken('0x100b8fd10ff8DC43fda45E636B4BB1eE6088270a')).toBeTruthy()
    })
    it('returns true when foreign address is included', () => {
      expect(isCustomBridgeToken('0x4738c5e91c4f809da21dd0df4b5ad5f699878c1c')).toBeTruthy()
    })
  })

  describe('#getForeignCustomBridgeAddress', () => {
    it('given home token address returns foreign bridge address', () => {
      expect(getForeignCustomBridgeAddress('0x100b8fd10ff8DC43fda45E636B4BB1eE6088270a')).toEqual(
        '0xEDA39475415f1A2944a467Aa6359CB4C1c3ed50f'
      )
    })
    it('given foreign token address returns foreign bridge address', () => {
      expect(getForeignCustomBridgeAddress('0x4738c5e91c4f809da21dd0df4b5ad5f699878c1c')).toEqual(
        '0xEDA39475415f1A2944a467Aa6359CB4C1c3ed50f'
      )
    })
  })

  describe('#getHomeCustomBridgeAddress', () => {
    it('given home token address returns home bridge address', () => {
      expect(getHomeCustomBridgeAddress('0x100b8fd10ff8DC43fda45E636B4BB1eE6088270a')).toEqual(
        '0x6aF8ac12f9a285fBeb30D2a7eEcf15B8D4B59253'
      )
    })
    it('given foreign token address returns home bridge address', () => {
      expect(getHomeCustomBridgeAddress('0x4738c5e91c4f809da21dd0df4b5ad5f699878c1c')).toEqual(
        '0x6aF8ac12f9a285fBeb30D2a7eEcf15B8D4B59253'
      )
    })
  })
})
