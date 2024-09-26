import { Currency, Token } from '@uniswap/sdk-core'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { SerializedToken } from 'uniswap/src/features/tokens/slice/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'

const DEFAULT_MAX_SYMBOL_CHARACTERS = 6

export function getSymbolDisplayText(symbol: Maybe<string>): Maybe<string> {
  if (!symbol) {
    return symbol
  }

  return symbol.length > DEFAULT_MAX_SYMBOL_CHARACTERS
    ? symbol?.substring(0, DEFAULT_MAX_SYMBOL_CHARACTERS - 3) + '...'
    : symbol
}

export function wrappedNativeCurrency(chainId: UniverseChainId): Token {
  const wrappedCurrencyInfo = UNIVERSE_CHAIN_INFO[chainId].wrappedNativeCurrency
  return new Token(
    chainId,
    wrappedCurrencyInfo.address,
    wrappedCurrencyInfo.decimals,
    wrappedCurrencyInfo.symbol,
    wrappedCurrencyInfo.name,
  )
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

export function getFormattedCurrencyAmount(
  currency: Maybe<Currency>,
  currencyAmountRaw: string,
  formatter: LocalizationContextState,
  isApproximateAmount = false,
  valueType = ValueType.Raw,
): string {
  const currencyAmount = getCurrencyAmount({
    value: currencyAmountRaw,
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

  return tokenAddressString && getValidAddress(tokenAddressString, true)
    ? shortenAddress(tokenAddressString)
    : tokenAddressString
}
