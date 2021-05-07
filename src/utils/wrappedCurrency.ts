import { supportedChainId } from 'utils'
import { ChainId, Currency, ETHER, Token, CurrencyAmount, WETH9 } from '@uniswap/sdk-core'

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  return chainId && currency === ETHER ? WETH9[chainId] : currency instanceof Token ? currency : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: ChainId | undefined
): CurrencyAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? new CurrencyAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isEther) return currency
  const formattedChainId = supportedChainId(currency.chainId)
  if (formattedChainId && currency.equals(WETH9[formattedChainId])) return ETHER
  return currency
}
