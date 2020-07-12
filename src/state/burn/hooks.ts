import { JSBI, Pair, Percent, Route, Token, TokenAmount } from '@uniswap/sdk'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PairState, usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { Field, setBurnDefaultsFromURLMatchParams, typeInput } from './actions'

const ZERO = JSBI.BigInt(0)

export function useBurnState(): AppState['burn'] {
  return useSelector<AppState, AppState['burn']>(state => state.burn)
}

export function useDerivedBurnInfo(): {
  tokens: { [field in Extract<Field, Field.CURRENCY_A | Field.CURRENCY_B>]?: Token }
  pair?: Pair | null
  route?: Route
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
  const tokens: { [field in Extract<Field, Field.CURRENCY_A | Field.CURRENCY_B>]?: Token } = useMemo(
    () => ({
      [Field.CURRENCY_A]: tokenA ?? undefined,
      [Field.CURRENCY_B]: tokenB ?? undefined
    }),
    [tokenA, tokenB]
  )

  // pair + totalsupply
  const [pairState, pair] = usePair(tokens[Field.CURRENCY_A], tokens[Field.CURRENCY_B])
  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(pair && JSBI.equal(pair.reserve0.raw, ZERO) && JSBI.equal(pair.reserve1.raw, ZERO))

  // route
  const route =
    !noLiquidity && pair && tokens[Field.CURRENCY_A] ? new Route([pair], tokens[Field.CURRENCY_A] as Token) : undefined

  // balances
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [pair?.liquidityToken])
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[pair?.liquidityToken?.address ?? '']

  // liquidity values
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const liquidityValues: { [field in Extract<Field, Field.CURRENCY_A | Field.CURRENCY_B>]?: TokenAmount } = {
    [Field.CURRENCY_A]:
      pair &&
      tokens[Field.CURRENCY_A] &&
      totalSupply &&
      userLiquidity &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
        ? new TokenAmount(
            tokens[Field.CURRENCY_A] as Token,
            pair.getLiquidityValue(tokens[Field.CURRENCY_A] as Token, totalSupply, userLiquidity, false).raw
          )
        : undefined,
    [Field.CURRENCY_B]:
      pair &&
      tokens[Field.CURRENCY_B] &&
      totalSupply &&
      userLiquidity &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
        ? new TokenAmount(
            tokens[Field.CURRENCY_B] as Token,
            pair.getLiquidityValue(tokens[Field.CURRENCY_B] as Token, totalSupply, userLiquidity, false).raw
          )
        : undefined
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
      if (
        independentAmount &&
        liquidityValues[independentField] &&
        !independentAmount.greaterThan(liquidityValues[independentField] as TokenAmount)
      ) {
        percentToRemove = new Percent(independentAmount.raw, (liquidityValues[independentField] as TokenAmount).raw)
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
      tokens[Field.CURRENCY_A] &&
      percentToRemove &&
      percentToRemove.greaterThan('0') &&
      liquidityValues[Field.CURRENCY_A]
        ? new TokenAmount(
            tokens[Field.CURRENCY_A] as Token,
            percentToRemove.multiply((liquidityValues[Field.CURRENCY_A] as TokenAmount).raw).quotient
          )
        : undefined,
    [Field.CURRENCY_B]:
      tokens[Field.CURRENCY_B] &&
      percentToRemove &&
      percentToRemove.greaterThan('0') &&
      liquidityValues[Field.CURRENCY_B]
        ? new TokenAmount(
            tokens[Field.CURRENCY_B] as Token,
            percentToRemove.multiply((liquidityValues[Field.CURRENCY_B] as TokenAmount).raw).quotient
          )
        : undefined
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  return { tokens, pair, route, parsedAmounts, error }
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
