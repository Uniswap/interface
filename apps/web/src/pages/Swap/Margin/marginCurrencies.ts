import { type Currency, type CurrencyAmount, Token } from '@uniswap/sdk-core'
import { areAddressesEqual, normalizeTokenAddressForCache } from '@universe/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginPlanStep,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { buildCurrencyId, buildNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { MARGIN_CHAIN_ID, type MarginMarket, type MarginTokenInfo } from '~/constants/margin'
import { isMarginWrappedNative } from '~/pages/Swap/Margin/marginTokenDisplay'
import { maxAmountSpend } from '~/utils/maxAmountSpend'

// Equity the user supplies. The ETH market takes native ETH; others take the ERC20 collateral.
export function getMarginEquityCurrency(market: MarginMarket): Currency {
  if (market.shouldUseNativeEquity) {
    return nativeOnChain(MARGIN_CHAIN_ID)
  }
  return new Token(MARGIN_CHAIN_ID, market.collateral.address, market.collateral.decimals, market.collateral.symbol)
}

export function getMarginEquityCurrencyInfo(market: MarginMarket): CurrencyInfo {
  const currency = getMarginEquityCurrency(market)
  return buildCurrencyInfo({ currency, currencyId: currencyId(currency), logoUrl: null })
}

// Currency for a selected payment token (native ETH or an ERC20 from the routable set).
// Chain-aware: an L2 bridge source builds its Token on the L2 chain, so a balance/logo
// lookup doesn't resolve the L2-USDC address against mainnet.
export function getPaymentCurrency(paymentToken: MarginPaymentToken): Currency {
  if (paymentToken.isNative) {
    return nativeOnChain(paymentToken.chainId)
  }
  return new Token(paymentToken.chainId, paymentToken.address, paymentToken.decimals, paymentToken.symbol)
}

// Market default payment token: the collateral, or native ETH on the ETH market.
export function getMarketDefaultPaymentToken(market: MarginMarket): MarginPaymentToken {
  if (market.shouldUseNativeEquity) {
    return {
      address: MARGIN_NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      chainId: MARGIN_CHAIN_ID,
    }
  }
  return {
    address: market.collateral.address,
    symbol: market.collateral.symbol,
    decimals: market.collateral.decimals,
    isNative: false,
    chainId: MARGIN_CHAIN_ID,
  }
}

// currencyId for an asset's deposited token: native ETH for native-equity markets, else the ERC20 collateral.
// Used to resolve real logos from the data API (keyed by mainnet chain + address). Wrapped-native
// (WETH) collateral routes to native even when shouldUseNativeEquity is false (the fallback market),
// so its logo still shows as ETH.
export function marginAssetCurrencyId(input: { collateral: MarginTokenInfo; shouldUseNativeEquity: boolean }): string {
  if (input.shouldUseNativeEquity || isMarginWrappedNative({ address: input.collateral.address })) {
    return buildNativeCurrencyId(MARGIN_CHAIN_ID)
  }
  return buildCurrencyId(MARGIN_CHAIN_ID, input.collateral.address)
}

// currencyId for any margin token by its mainnet address (e.g. debt tokens). Resolves logos from the
// data API. Wrapped-native (WETH) routes to the native currencyId so its logo shows as ETH — the
// native CurrencyInfo is always resolved, so even dynamic WETH-debt tokens get art.
export function marginTokenCurrencyId(token: MarginTokenInfo): string {
  if (isMarginWrappedNative({ address: token.address })) {
    return buildNativeCurrencyId(MARGIN_CHAIN_ID)
  }
  return buildCurrencyId(MARGIN_CHAIN_ID, token.address)
}

// currencyId for a plan step's source `tokenIn`, chain-aware off the wire's tokenInChainId.
// The mainnet static catalog can't reach a source-chain (e.g. Unichain) token, so cross-chain
// pre-swap/approval display names resolve through the standard data-API resolver instead. Guarded:
// a native (0x0) tokenIn on a non-Universe chainId would throw in getChainInfo at render.
export function marginStepTokenInCurrencyId(step: MarginPlanStep): string | undefined {
  if (!step.tokenIn) {
    return undefined
  }
  const chainId = step.tokenInChainId ?? MARGIN_CHAIN_ID
  if (!isUniverseChainId(chainId)) {
    return undefined
  }
  if (normalizeTokenAddressForCache(step.tokenIn) === MARGIN_NATIVE_TOKEN_ADDRESS) {
    return buildNativeCurrencyId(chainId)
  }
  return buildCurrencyId(chainId, step.tokenIn)
}

// Chain-aware token identity. A token can share its address across chains (e.g. cbBTC's
// vanity address on Ethereum and Base) — address-only comparisons would conflate an L2 token with its
// mainnet counterpart. Any payment token off the margin chain always differs from collateral: it always
// needs the bridge path, regardless of address.
export function isPaymentTokenDifferentFromCollateral({
  token,
  market,
}: {
  token: MarginPaymentToken
  market: MarginMarket
}): boolean {
  if (token.chainId !== MARGIN_CHAIN_ID) {
    return true
  }
  if (token.isNative) {
    return !market.shouldUseNativeEquity
  }
  return !areAddressesEqual({
    addressInput1: { address: token.address, chainId: MARGIN_CHAIN_ID },
    addressInput2: { address: market.collateral.address, chainId: MARGIN_CHAIN_ID },
  })
}

// Same chain-awareness for "is this the market default": an off-chain address match (e.g. Base cbBTC vs
// mainnet cbBTC) must never resolve as the default, or the selection collapses to undefined on save and
// the L2 pick becomes unreachable.
export function isMarketDefaultPaymentToken({
  token,
  market,
}: {
  token: MarginPaymentToken
  market: MarginMarket
}): boolean {
  const defaultToken = getMarketDefaultPaymentToken(market)
  return (
    token.chainId === MARGIN_CHAIN_ID &&
    token.isNative === defaultToken.isNative &&
    normalizeTokenAddressForCache(token.address) === normalizeTokenAddressForCache(defaultToken.address)
  )
}

// Gas-reserve deduction for the spendable balance. Applies to any native payment token,
// not just on the margin chain — an L2 source's gas also comes out of that same native balance, so
// maxing a native L2 payment needs the same reserve maxAmountSpend already carves out on mainnet.
export function getSpendablePaymentBalance({
  paymentToken,
  balance,
}: {
  paymentToken: MarginPaymentToken
  balance: CurrencyAmount<Currency> | undefined
}): CurrencyAmount<Currency> | undefined {
  return paymentToken.isNative ? maxAmountSpend(balance) : balance
}
