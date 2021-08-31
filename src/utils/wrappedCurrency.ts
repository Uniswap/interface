import {
  ChainId,
  Currency,
  ETHER,
  Token,
  CurrencyAmount,
  wrappedCurrency as wrappedCurrencyInternal,
  wrappedCurrencyAmount as wrappedCurrencyAmountInternal,
  WETH9,
} from '@uniswap/sdk-core'
import { supportedChainId } from './supportedChainId'

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  return chainId && currency ? wrappedCurrencyInternal(currency, chainId) : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount<Currency> | undefined,
  chainId: ChainId | undefined
): CurrencyAmount<Token> | undefined {
  return currencyAmount && chainId ? wrappedCurrencyAmountInternal(currencyAmount, chainId) : undefined
}

export function unwrappedToken(token: Token): Currency {
  if (token.isEther) return token
  const formattedChainId = supportedChainId(token.chainId)
  if (formattedChainId && token.equals(WETH9[formattedChainId])) return ETHER
  return token
}
