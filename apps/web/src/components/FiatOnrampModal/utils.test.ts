import { ChainId, WETH9 } from '@uniswap/sdk-core'
import {
  MATIC_MAINNET,
  NATIVE_CHAIN_ID,
  USDC_ARBITRUM,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  WBTC,
  WETH_POLYGON,
} from 'constants/tokens'

import { CHAIN_INFO } from 'constants/chains'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getDefaultCurrencyCode, parsePathParts } from './utils'

describe('getDefaultCurrencyCode', () => {
  it('NATIVE/arbitrum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, Chain.Arbitrum)).toBe('eth_arbitrum')
  })
  it('NATIVE/optimism should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, Chain.Optimism)).toBe('eth_optimism')
  })
  it('WETH/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WETH_POLYGON.address, Chain.Polygon)).toBe('eth_polygon')
  })
  it('WETH/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WETH9[ChainId.MAINNET].address, Chain.Ethereum)).toBe('weth')
  })
  it('WBTC/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WBTC.address, Chain.Ethereum)).toBe('wbtc')
  })
  it('NATIVE/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, Chain.Polygon)).toBe('matic_polygon')
  })
  it('MATIC/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(MATIC_MAINNET.address, Chain.Ethereum)).toBe('polygon')
  })
  it('USDC/arbitrum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_ARBITRUM.address, Chain.Arbitrum)).toBe('usdc_arbitrum')
  })
  it('USDC/optimism should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_OPTIMISM.address, Chain.Optimism)).toBe('usdc_optimism')
  })
  it('USDC/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_POLYGON.address, Chain.Polygon)).toBe('usdc_polygon')
  })
  it('native/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, Chain.Ethereum)).toBe('eth')
  })
  it('usdc/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_MAINNET.address, Chain.Ethereum)).toBe('usdc')
  })
  it('usdt/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDT.address, Chain.Ethereum)).toBe('usdt')
  })
  it('chain/token mismatch should default to eth', () => {
    expect(getDefaultCurrencyCode(USDC_ARBITRUM.address, Chain.Ethereum)).toBe('eth')
    expect(getDefaultCurrencyCode(USDC_OPTIMISM.address, Chain.Ethereum)).toBe('eth')
    expect(getDefaultCurrencyCode(USDC_POLYGON.address, Chain.Ethereum)).toBe('eth')
    expect(getDefaultCurrencyCode(MATIC_MAINNET.address, Chain.Arbitrum)).toBe('eth')
  })
})

describe('parseLocation', () => {
  it('should parse the URL correctly', () => {
    expect(parsePathParts('/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')).toEqual({
      chain: CHAIN_INFO[ChainId.MAINNET],
      tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    })
    expect(parsePathParts('tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')).toEqual({
      chain: CHAIN_INFO[ChainId.MAINNET],
      tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    })
    expect(parsePathParts('/swap')).toEqual({
      chain: undefined,
      tokenAddress: undefined,
    })
  })
})
