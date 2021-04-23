import { Currency, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useUnsupportedTokens } from './Tokens'

/**
 * Returns true if the input currency or output currency cannot be traded in the interface
 * @param currencyIn the input currency to check
 * @param currencyOut the output currency to check
 */
export function useIsSwapUnsupported(currencyIn?: Currency, currencyOut?: Currency): boolean {
  const unsupportedTokens: { [address: string]: Token } = useUnsupportedTokens()

  return useMemo(() => {
    // if unsupported list loaded & either token on list, mark as unsupported
    return Boolean(
      unsupportedTokens &&
        ((currencyIn && currencyIn instanceof Token && unsupportedTokens[currencyIn.address]) ||
          (currencyOut && currencyOut instanceof Token && unsupportedTokens[currencyOut.address]))
    )
  }, [currencyIn, currencyOut, unsupportedTokens])
}
