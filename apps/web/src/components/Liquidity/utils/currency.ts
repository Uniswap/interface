import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Token } from '@uniswap/sdk-core'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'

export function getCurrencyForProtocol(
  currency: Currency,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token
export function getCurrencyForProtocol(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token | undefined
export function getCurrencyForProtocol(currency: Currency, protocolVersion: ProtocolVersion.V4): Currency
export function getCurrencyForProtocol(currency: Maybe<Currency>, protocolVersion: ProtocolVersion.V4): Maybe<Currency>
export function getCurrencyForProtocol(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.UNSPECIFIED | ProtocolVersion.V2 | ProtocolVersion.V3 | ProtocolVersion.V4,
): Maybe<Currency>
/**
 * Gets the currency or token that each protocol expects. For v2 + v3 if the native currency is passed then we return the wrapped version.
 * For v4 is a wrapped native token is passed then we return the native currency.
 */
export function getCurrencyForProtocol(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion,
): Currency | Token | undefined {
  if (!currency) {
    return undefined
  }

  if (protocolVersion === ProtocolVersion.V4) {
    const wrappedNative = WRAPPED_NATIVE_CURRENCY[currency.chainId]
    if (areCurrenciesEqual(wrappedNative, currency)) {
      return nativeOnChain(currency.chainId)
    }

    return currency
  }

  if (currency.isToken) {
    return currency
  }

  return currency.wrapped
}

export function getCurrencyWithWrap(currency: Currency, protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3): Token
export function getCurrencyWithWrap(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token | undefined
export function getCurrencyWithWrap(currency: Currency, protocolVersion: ProtocolVersion.V4): Currency
export function getCurrencyWithWrap(currency: Maybe<Currency>, protocolVersion: ProtocolVersion.V4): Maybe<Currency>
export function getCurrencyWithWrap(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.UNSPECIFIED | ProtocolVersion.V2 | ProtocolVersion.V3 | ProtocolVersion.V4,
): Maybe<Currency>
export function getCurrencyWithWrap(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion,
): Maybe<Currency> | Token {
  if (protocolVersion === ProtocolVersion.V4 || currency?.isToken) {
    return currency
  }

  return currency?.wrapped
}

export function getTokenOrZeroAddress(currency: Currency): string
export function getTokenOrZeroAddress(currency: Maybe<Currency>): string | undefined
export function getTokenOrZeroAddress(currency: Maybe<Currency>): string | undefined {
  if (!currency) {
    return undefined
  }

  if (currency.isNative && currency.chainId === UniverseChainId.Celo) {
    return getChainInfo(UniverseChainId.Celo).nativeCurrency.address
  }

  return currency.isToken ? currency.address : ZERO_ADDRESS
}

// update to validate sort order
export function validateCurrencyInput(currencies: { [field in PositionField]: Maybe<Currency> }): boolean {
  return !!currencies.TOKEN0 && !!currencies.TOKEN1
}

export function getBaseAndQuoteCurrencies<T extends Maybe<Currency>>(
  sortedCurrencies: { [field in PositionField]: T },
  inverted: boolean,
): { baseCurrency: T; quoteCurrency: T } {
  return inverted
    ? { baseCurrency: sortedCurrencies.TOKEN1, quoteCurrency: sortedCurrencies.TOKEN0 }
    : { baseCurrency: sortedCurrencies.TOKEN0, quoteCurrency: sortedCurrencies.TOKEN1 }
}

export function canUnwrapCurrency(currency: Maybe<Currency>, protocolVersion?: ProtocolVersion): boolean {
  if (protocolVersion === ProtocolVersion.V4 || !currency) {
    return false
  }

  const wrappedNative = WRAPPED_NATIVE_CURRENCY[currency.chainId]
  return areCurrenciesEqual(wrappedNative, currency)
}

export function getCurrencyWithOptionalUnwrap({
  currency,
  shouldUnwrap,
}: {
  currency: Currency
  shouldUnwrap: boolean
}): Currency
export function getCurrencyWithOptionalUnwrap({
  currency,
  shouldUnwrap,
}: {
  currency: Maybe<Currency>
  shouldUnwrap: boolean
}): Maybe<Currency>
export function getCurrencyWithOptionalUnwrap({
  currency,
  shouldUnwrap,
}: {
  currency: Maybe<Currency>
  shouldUnwrap: boolean
}) {
  if (!currency) {
    return undefined
  }

  const wrappedNative = WRAPPED_NATIVE_CURRENCY[currency.chainId]
  const isWrappedNative = areCurrenciesEqual(wrappedNative, currency)

  if (!isWrappedNative || !shouldUnwrap) {
    return currency
  }

  return nativeOnChain(currency.chainId)
}
