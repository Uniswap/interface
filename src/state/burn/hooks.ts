import { JSBI, Pair, Percent, Token, TokenAmount } from '@uniswap/sdk'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { Field, setBurnDefaultsFromURLMatchParams, typeInput } from './actions'

export function useBurnState(): AppState['burn'] {
  return useSelector<AppState, AppState['burn']>(state => state.burn)
}

export function useDerivedBurnInfo(): {
  tokens: { [Field.CURRENCY_A]?: Token; [Field.CURRENCY_B]?: Token }
  pair?: Pair | null
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: TokenAmount
    [Field.CURRENCY_B]?: TokenAmount
  }
  error?: string
} {
  const { account } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    [Field.CURRENCY_A]: { address: tokenAAddress },
    [Field.CURRENCY_B]: { address: tokenBAddress }
  } = useBurnState()

  // tokens
  const tokenA = useToken(tokenAAddress)
  const tokenB = useToken(tokenBAddress)
  const tokens: { [Field.CURRENCY_A]?: Token; [Field.CURRENCY_B]?: Token } = useMemo(
    () => ({
      [Field.CURRENCY_A]: tokenA ?? undefined,
      [Field.CURRENCY_B]: tokenB ?? undefined
    }),
    [tokenA, tokenB]
  )

  // pair + totalsupply
  const [, pair] = usePair(tokens[Field.CURRENCY_A], tokens[Field.CURRENCY_B])

  // balances
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [pair?.liquidityToken])
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[pair?.liquidityToken?.address ?? '']

  // liquidity values
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const liquidityValueA =
    pair &&
    tokenA &&
    totalSupply &&
    userLiquidity &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupply, userLiquidity, false).raw)
      : undefined
  const liquidityValueB =
    pair &&
    tokenB &&
    totalSupply &&
    userLiquidity &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupply, userLiquidity, false).raw)
      : undefined
  const liquidityValues: { [Field.CURRENCY_A]?: TokenAmount; [Field.CURRENCY_B]?: TokenAmount } = {
    [Field.CURRENCY_A]: liquidityValueA,
    [Field.CURRENCY_B]: liquidityValueB
  }

  let percentToRemove: Percent = new Percent('0', '100')
  // user specified a %
  if (independentField === Field.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValue, '100')
  }
  // user specified a specific amount of liquidity tokens
  else if (independentField === Field.LIQUIDITY) {
    if (pair?.liquidityToken) {
      const independentAmount = tryParseAmount(typedValue, pair.liquidityToken)
      if (independentAmount && userLiquidity && !independentAmount.greaterThan(userLiquidity)) {
        percentToRemove = new Percent(independentAmount.raw, userLiquidity.raw)
      }
    }
  }
  // user specified a specific amount of token a or b
  else {
    if (tokens[independentField]) {
      const independentAmount = tryParseAmount(typedValue, tokens[independentField])
      const liquidityValue = liquidityValues[independentField]
      if (independentAmount && liquidityValue && !independentAmount.greaterThan(liquidityValue)) {
        percentToRemove = new Percent(independentAmount.raw, liquidityValue.raw)
      }
    }
  }

  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: TokenAmount
    [Field.CURRENCY_B]?: TokenAmount
  } = {
    [Field.LIQUIDITY_PERCENT]: percentToRemove,
    [Field.LIQUIDITY]:
      userLiquidity && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(userLiquidity.token, percentToRemove.multiply(userLiquidity.raw).quotient)
        : undefined,
    [Field.CURRENCY_A]:
      tokenA && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueA
        ? new TokenAmount(tokenA, percentToRemove.multiply(liquidityValueA.raw).quotient)
        : undefined,
    [Field.CURRENCY_B]:
      tokenB && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueB
        ? new TokenAmount(tokenB, percentToRemove.multiply(liquidityValueB.raw).quotient)
        : undefined
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  return { tokens, pair, parsedAmounts, error }
}

export function useBurnActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  return {
    onUserInput
  }
}

// updates the burn state to use the appropriate tokens, given the route
export function useDefaultsFromURLMatchParams(params: { tokens: string }) {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    if (!chainId) return
    dispatch(setBurnDefaultsFromURLMatchParams({ chainId, params }))
  }, [dispatch, chainId, params])
}
