import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId, getValidAddress } from '@universe/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { SerializedToken } from 'uniswap/src/features/tokens/warnings/slice/types'
import { shortenAddress } from 'utilities/src/addresses'

const DEFAULT_MAX_SYMBOL_CHARACTERS = 6

export function getSymbolDisplayText(
  symbol: Maybe<string>,
  maxCharacters: number = DEFAULT_MAX_SYMBOL_CHARACTERS,
): Maybe<string> {
  if (!symbol) {
    return symbol
  }

  return symbol.length > maxCharacters ? symbol.substring(0, maxCharacters - 1) + '…' : symbol
}

/**
 * The chain's wrapped native as described by `getChainInfo`, built fresh on each call.
 *
 * This is metadata, not the instance `Currency.wrapped` resolves to — that reads the separate,
 * hand-maintained `WRAPPED_NATIVE_CURRENCY` map, and the two can disagree. To guard or replace a
 * `.wrapped` read, use {@link getWrappedTokenIfExists}, which reads the same map and so cannot
 * disagree with the getter it stands in for.
 */
export function wrappedNativeCurrency(chainId: UniverseChainId): Token | undefined {
  const wrappedCurrencyInfo = getChainInfo(chainId).wrappedNativeCurrency
  if (!wrappedCurrencyInfo) {
    return undefined
  }
  return new Token(
    chainId,
    wrappedCurrencyInfo.address,
    wrappedCurrencyInfo.decimals,
    wrappedCurrencyInfo.symbol,
    wrappedCurrencyInfo.name,
  )
}

export function getWrappedTokenIfExists(currency: Token): Token
export function getWrappedTokenIfExists(currency: null | undefined): undefined
export function getWrappedTokenIfExists(currency: Maybe<Currency>): Token | undefined
/**
 * A currency's wrapped (ERC-20) form, or `undefined` when the chain has no wrapped native.
 *
 * Prefer this over `Currency.wrapped` anywhere a native currency can reach a wrapped-only (v2/v3)
 * code path: Arc and Tempo have no wrapped native, so the getter throws `Unsupported chain ID`
 * there instead of returning undefined (see {@link NativeCurrencyImpl.wrapped}), which takes down
 * the whole render rather than leaving the caller a value to handle.
 *
 * A `Token` narrows to `Token` and a nullish input to `undefined`, but a `Currency` that may be
 * native stays `Token | undefined` on purpose: on Arc/Tempo it genuinely has no wrapped form.
 * Promising `Token` for any non-null `Currency` is the exact claim the throwing getter already
 * makes, and the reason callers crashed instead of handling a missing value.
 */
export function getWrappedTokenIfExists(currency: Maybe<Currency>): Token | undefined {
  if (!currency) {
    return undefined
  }

  // Token.wrapped is the token itself; only the native getter can throw.
  return currency.isToken ? currency : WRAPPED_NATIVE_CURRENCY[currency.chainId]
}

export function getWrappedAmountIfExists(amount: CurrencyAmount<Token>): CurrencyAmount<Token>
export function getWrappedAmountIfExists(amount: null | undefined): undefined
export function getWrappedAmountIfExists(amount: Maybe<CurrencyAmount<Currency>>): CurrencyAmount<Token> | undefined
/**
 * A currency amount re-denominated in its wrapped form, or `undefined` when the chain has no
 * wrapped native. `CurrencyAmount.wrapped` reads the same throwing getter, so prefer this
 * wherever a native amount can reach a wrapped-only (v2/v3) code path.
 *
 * Narrows like {@link getWrappedTokenIfExists}.
 */
export function getWrappedAmountIfExists(amount: Maybe<CurrencyAmount<Currency>>): CurrencyAmount<Token> | undefined {
  if (!amount) {
    return undefined
  }

  if (amount.currency.isToken) {
    return amount as CurrencyAmount<Token>
  }

  const wrapped = getWrappedTokenIfExists(amount.currency)
  return wrapped ? CurrencyAmount.fromFractionalAmount(wrapped, amount.numerator, amount.denominator) : undefined
}

export function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    name: token.name,
    symbol: token.symbol,
  }
}

export function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name,
  )
}

export function getFormattedCurrencyAmount({
  currency,
  amount,
  formatter,
  isApproximateAmount = false,
  valueType = ValueType.Raw,
}: {
  currency: Maybe<Currency>
  amount: string
  formatter: LocalizationContextState
  isApproximateAmount?: boolean
  valueType?: ValueType
}): string {
  const currencyAmount = getCurrencyAmount({
    value: amount,
    valueType,
    currency,
  })

  if (!currencyAmount) {
    return ''
  }

  const formattedAmount = formatter.formatCurrencyAmount({ value: currencyAmount })
  return isApproximateAmount ? `~${formattedAmount} ` : `${formattedAmount} `
}

export function getCurrencyDisplayText(
  currency: Maybe<Currency>,
  tokenAddressString: Address | undefined,
): string | undefined {
  const symbolDisplayText = getSymbolDisplayText(currency?.symbol)

  if (symbolDisplayText) {
    return symbolDisplayText
  }

  return tokenAddressString &&
    getValidAddress({
      address: tokenAddressString,
      chainId: currency?.chainId ?? UniverseChainId.Mainnet,
    })
    ? shortenAddress({ address: tokenAddressString })
    : tokenAddressString
}
