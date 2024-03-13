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

import { getDefaultCurrencyCode, parsePathParts } from './utils'

describe('getDefaultCurrencyCode', () => {
  it('NATIVE/arbitrum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, 'arbitrum')).toBe('eth_arbitrum')
  })
  it('NATIVE/optimism should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, 'optimism')).toBe('eth_optimism')
  })
  it('WETH/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WETH_POLYGON.address, 'polygon')).toBe('eth_polygon')
  })
  it('WETH/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WETH9[ChainId.MAINNET].address, 'ethereum')).toBe('weth')
  })
  it('WBTC/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WBTC.address, 'ethereum')).toBe('wbtc')
  })
  it('NATIVE/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, 'polygon')).toBe('matic_polygon')
  })
  it('MATIC/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(MATIC_MAINNET.address, 'ethereum')).toBe('polygon')
  })
  it('USDC/arbitrum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_ARBITRUM.address, 'arbitrum')).toBe('usdc_arbitrum')
  })
  it('USDC/optimism should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_OPTIMISM.address, 'optimism')).toBe('usdc_optimism')
  })
  it('USDC/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_POLYGON.address, 'polygon')).toBe('usdc_polygon')
  })
  it('native/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(NATIVE_CHAIN_ID, 'ethereum')).toBe('eth')
  })
  it('usdc/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_MAINNET.address, 'ethereum')).toBe('usdc')
  })
  it('usdt/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDT.address, 'ethereum')).toBe('usdt')
  })
  it('chain/token mismatch should default to eth', () => {
    expect(getDefaultCurrencyCode(USDC_ARBITRUM.address, 'ethereum')).toBe('eth')
    expect(getDefaultCurrencyCode(USDC_OPTIMISM.address, 'ethereum')).toBe('eth')
    expect(getDefaultCurrencyCode(USDC_POLYGON.address, 'ethereum')).toBe('eth')
    expect(getDefaultCurrencyCode(MATIC_MAINNET.address, 'arbitrum')).toBe('eth')
  })
})

describe('parseLocation', () => {
  it('should parse the URL correctly', () => {
    expect(parsePathParts('/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')).toEqual({
      network: 'ethereum',
      tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    })
    expect(parsePathParts('tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')).toEqual({
      network: 'ethereum',
      tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    })
    expect(parsePathParts('/swap')).toEqual({
      network: undefined,
      tokenAddress: undefined,
    })
  })
})
