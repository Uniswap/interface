import { supportedChainId } from 'utils'
import {
  ChainId,
  Currency,
  ETHER,
  Token,
  CurrencyAmount,
  WETH9,
  wrappedCurrency as wrappedCurrencyInternal,
  wrappedCurrencyAmount as wrappedCurrencyAmountInternal,
} from '@uniswap/sdk-core'

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  return chainId && currency ? wrappedCurrencyInternal(currency, chainId) : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount<Currency> | undefined,
  chainId: ChainId | undefined
): CurrencyAmount<Token> | undefined {
  return currencyAmount && chainId ? wrappedCurrencyAmountInternal(currencyAmount, chainId) : undefined
}

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isEther) return currency
  const formattedChainId = supportedChainId(currency.chainId)
  if (formattedChainId && currency.equals(WETH9[formattedChainId])) return ETHER
  return currency
}
