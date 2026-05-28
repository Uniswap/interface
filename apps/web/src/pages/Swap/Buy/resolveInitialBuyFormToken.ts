import { ParsedQs } from 'qs'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'

/**
 * Resolves which `FiatOnRampCurrency` the buy form should pre-select, in priority order:
 *   1. `initialCurrency` (e.g. swap output) when no URL token params are present
 *   2. Explicit `currencyId` URL param — exact identity match (used by the insufficient-gas warning)
 *   3. `currencyCode` + provider list — ad-driven, matches by `meldCurrencyCode`
 *   4. `currencyCode` + `chainId` — symbol+chain match
 *   5. Mainnet ETH fallback
 */
export function resolveInitialBuyFormToken({
  parsedQs,
  supportedTokens,
  initialCurrency,
}: {
  parsedQs: ParsedQs
  supportedTokens: FiatOnRampCurrency[] | undefined
  initialCurrency?: TradeableAsset | null
}): FiatOnRampCurrency | undefined {
  const currencyIdParam = parsedQs.currencyId as string | undefined
  const currencyCode = parsedQs.currencyCode as string | undefined
  const providers = (parsedQs.providers as string | undefined)?.split(',')
  const hasProviders = !!providers && providers.length > 0

  if (initialCurrency && !currencyIdParam && !currencyCode) {
    const supportedNativeToken = supportedTokens?.find(
      (meldToken) =>
        meldToken.currencyInfo?.currency.chainId === initialCurrency.chainId &&
        meldToken.currencyInfo.currency.isNative,
    )
    return (
      supportedTokens?.find(
        (meldToken) =>
          meldToken.currencyInfo?.currency.chainId === initialCurrency.chainId &&
          meldToken.currencyInfo.currency.isToken &&
          meldToken.currencyInfo.currency.address === initialCurrency.address,
      ) ?? supportedNativeToken
    )
  }

  if (currencyIdParam) {
    // Exact-identity match — set when navigating from the insufficient-gas warning so we land on the precise token+chain.
    return supportedTokens?.find(
      (meldToken) =>
        meldToken.currencyInfo?.currencyId &&
        normalizeCurrencyIdForMapLookup(meldToken.currencyInfo.currencyId) ===
          normalizeCurrencyIdForMapLookup(currencyIdParam),
    )
  }

  if (hasProviders && currencyCode) {
    // Meld's currency code, since chainId is not set when coming from an ad
    return supportedTokens?.find(
      (meldToken) => meldToken.meldCurrencyCode?.toLowerCase() === currencyCode.toLowerCase(),
    )
  }

  if (currencyCode) {
    const chainId = parsedQs.chainId ? Number(parsedQs.chainId) : UniverseChainId.Mainnet
    return supportedTokens?.find(
      (meldToken) =>
        meldToken.currencyInfo?.currency.symbol === currencyCode && meldToken.currencyInfo.currency.chainId === chainId,
    )
  }

  return (
    supportedTokens?.find((meldToken) =>
      meldToken.currencyInfo?.currency.equals(nativeOnChain(UniverseChainId.Mainnet)),
    ) ?? supportedTokens?.[0]
  )
}
