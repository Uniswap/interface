import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

export function useBlockedTokens(
  token0: Maybe<Currency>,
  token1: Maybe<Currency>,
): { hasBlockedToken: boolean; blockedTokenSymbols: string[] } {
  const token0CurrencyInfo = useCurrencyInfo(currencyId(token0))
  const token1CurrencyInfo = useCurrencyInfo(currencyId(token1))

  const isToken0Blocked = token0CurrencyInfo?.safetyInfo?.tokenList === TokenList.Blocked
  const isToken1Blocked = token1CurrencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

  const blockedTokenSymbols = useMemo(() => {
    const symbols: string[] = []
    if (isToken0Blocked) {
      symbols.push(token0CurrencyInfo.currency.symbol ?? 'Token 0')
    }
    if (isToken1Blocked) {
      symbols.push(token1CurrencyInfo.currency.symbol ?? 'Token 1')
    }
    return symbols
  }, [isToken0Blocked, isToken1Blocked, token0CurrencyInfo, token1CurrencyInfo])

  return { hasBlockedToken: isToken0Blocked || isToken1Blocked, blockedTokenSymbols }
}
