import { CurrencyAmount, Pair, Token, TokenAmount } from '@teleswap/sdk'
import { usePairUSDValue } from 'hooks/usePairValue'
import useUSDCPrice from 'utils/useUSDCPrice'

function isPair(token: Pair | Token | null): token is Pair {
  return !!(token as Pair).liquidityToken
}
function isToken(token: Pair | Token | null): token is Token {
  return !!(token as Token).decimals
}

export function useUSDEvaluation(token: Pair | Token | null, quantity?: TokenAmount): CurrencyAmount | undefined {
  const lpEvaluation = usePairUSDValue(isPair(token) ? token : null, quantity)
  const usdTokenPrice = useUSDCPrice(isToken(token) ? token : undefined)

  if (lpEvaluation) return lpEvaluation
  if (usdTokenPrice && quantity) return usdTokenPrice.quote(quantity)

  return undefined
}
