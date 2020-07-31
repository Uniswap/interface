import { ChainId, Currency, ETHER, Token, WETH } from '@uniswap/sdk'

function isEtherish(currency: Currency): boolean {
  return currency === ETHER || (currency instanceof Token && WETH[currency.chainId].equals(currency))
}

const AMPL_TOKEN_ADDRESS = '0xD46bA6D942050d489DBd938a2C909A5d5039A161'

/**
 * Band-aid on maxHops because some tokens seems to always fail with multihop swaps
 * @param currencyIn currency in
 * @param currencyOut currency out
 */
export function maxHopsFor(currencyIn: Currency, currencyOut: Currency): number {
  if (
    isEtherish(currencyIn) &&
    currencyOut instanceof Token &&
    currencyOut.chainId === ChainId.MAINNET &&
    currencyOut.address === AMPL_TOKEN_ADDRESS
  ) {
    return 1
  } else if (
    isEtherish(currencyOut) &&
    currencyIn instanceof Token &&
    currencyIn.chainId === ChainId.MAINNET &&
    currencyIn.address === AMPL_TOKEN_ADDRESS
  ) {
    return 1
  }

  return 3
}
