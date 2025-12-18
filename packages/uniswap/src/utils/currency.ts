import { Currency, Token } from '@uniswap/sdk-core'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { SerializedToken } from 'uniswap/src/features/tokens/warnings/slice/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'

const DEFAULT_MAX_SYMBOL_CHARACTERS = 6

export function getSymbolDisplayText(symbol: Maybe<string>): Maybe<string> {
  if (!symbol) {
    return symbol
  }

  return symbol.length > DEFAULT_MAX_SYMBOL_CHARACTERS
    ? symbol.substring(0, DEFAULT_MAX_SYMBOL_CHARACTERS - 1) + '…'
    : symbol
}

export function wrappedNativeCurrency(chainId: UniverseChainId): Token {
  const wrappedCurrencyInfo = getChainInfo(chainId).wrappedNativeCurrency
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
