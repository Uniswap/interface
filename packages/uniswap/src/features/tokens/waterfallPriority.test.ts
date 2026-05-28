import { Token } from '@uniswap/sdk-core'
import { nativeOnChain, USDC_MAINNET, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getTokenTier, shouldReverseForWaterfall, TokenTier } from 'uniswap/src/features/tokens/waterfallPriority'

const ETH = nativeOnChain(UniverseChainId.Mainnet)

const UNI = new Token(UniverseChainId.Mainnet, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap')

describe('getTokenTier', () => {
  it('classifies stablecoin as Tier 0', () => {
    expect(getTokenTier(USDC_MAINNET)).toBe(TokenTier.Stablecoin)
  })

  it('classifies native ETH as Tier 1', () => {
    expect(getTokenTier(ETH)).toBe(TokenTier.Native)
  })

  it('classifies WBTC as Tier 2', () => {
    expect(getTokenTier(WBTC)).toBe(TokenTier.BTC)
  })

  it('classifies arbitrary token as Tier 3', () => {
    expect(getTokenTier(UNI)).toBe(TokenTier.Other)
  })

  it('classifies BTC symbol variants as Tier 2', () => {
    const makeToken = (symbol: string) =>
      new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000001', 8, symbol)
    expect(getTokenTier(makeToken('BTCB'))).toBe(TokenTier.BTC)
    expect(getTokenTier(makeToken('TBTC'))).toBe(TokenTier.BTC)
    expect(getTokenTier(makeToken('CBBTC'))).toBe(TokenTier.BTC)
    expect(getTokenTier(makeToken('btcb'))).toBe(TokenTier.BTC)
  })
})

describe('shouldReverseForWaterfall', () => {
  // | tokenA         | tokenB         | result   | displayed as  |
  // |----------------|----------------|----------|---------------|
  // | USDC (stable)  | ETH (native)   | reversed | ETH / USDC    |
  // | ETH (native)   | UNI (other)    | reversed | UNI / ETH     |
  // | UNI (other)    | USDC (stable)  | default  | UNI / USDC    |
  // | WBTC (BTC)     | ETH (native)   | default  | WBTC / ETH    |

  it('reverses when tokenA is stablecoin and tokenB is native (USDC/ETH → ETH/USDC)', () => {
    expect(shouldReverseForWaterfall(USDC_MAINNET, ETH)).toBe(true)
  })

  it('reverses when tokenA is native and tokenB is other (ETH/UNI → UNI/ETH)', () => {
    expect(shouldReverseForWaterfall(ETH, UNI)).toBe(true)
  })

  it('does not reverse when tokenA is other and tokenB is stablecoin (UNI/USDC)', () => {
    expect(shouldReverseForWaterfall(UNI, USDC_MAINNET)).toBe(false)
  })

  it('does not reverse when tokenA is BTC and tokenB is native (WBTC/ETH)', () => {
    expect(shouldReverseForWaterfall(WBTC, ETH)).toBe(false)
  })

  it('does not reverse when both tokens are the same tier', () => {
    const USDT_MAINNET = new Token(
      UniverseChainId.Mainnet,
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      6,
      'USDT',
      'Tether USD',
    )
    expect(shouldReverseForWaterfall(USDC_MAINNET, USDT_MAINNET)).toBe(false)
  })

  it('reverses when tokenA is stablecoin and tokenB is BTC (USDC/WBTC → WBTC/USDC)', () => {
    expect(shouldReverseForWaterfall(USDC_MAINNET, WBTC)).toBe(true)
  })

  it('reverses when tokenA is native and tokenB is BTC (ETH/WBTC → WBTC/ETH)', () => {
    expect(shouldReverseForWaterfall(ETH, WBTC)).toBe(true)
  })
})
