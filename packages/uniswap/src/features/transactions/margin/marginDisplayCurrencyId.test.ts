import { UniverseChainId } from '@universe/chains'
import { getMarginDisplayCurrencyId } from 'uniswap/src/features/transactions/margin/marginDisplayCurrencyId'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyIdWithThrow,
} from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'

const USDC = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

describe(getMarginDisplayCurrencyId, () => {
  it.each([UniverseChainId.Mainnet, UniverseChainId.Base])('shows chain %s wrapped native as native', (chainId) => {
    expect(getMarginDisplayCurrencyId(buildWrappedNativeCurrencyIdWithThrow(chainId))).toBe(
      buildNativeCurrencyId(chainId),
    )
  })

  it('matches the wrapped native address in any case', () => {
    const lowercased = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet).toLowerCase()
    expect(getMarginDisplayCurrencyId(lowercased)).toBe(buildNativeCurrencyId(UniverseChainId.Mainnet))
  })

  it('leaves other tokens alone', () => {
    expect(getMarginDisplayCurrencyId(USDC)).toBe(USDC)
  })
})
