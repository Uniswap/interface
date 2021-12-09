import { Currency, CurrencyAmount, JSBI, Pair, Percent, Price, TokenAmount } from '@dynamic-amm/sdk'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { t } from '@lingui/macro'
import { usePairByAddress } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { Field, switchTokenField, typeInput } from './actions'
import { calculateSlippageAmount } from 'utils'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { useAppDispatch } from 'state/hooks'
import { useZapOutAmount } from 'hooks/useZap'
import { BigNumber } from '@ethersproject/bignumber'

export function useBurnState(): AppState['burn'] {
  return useSelector<AppState, AppState['burn']>(state => state.burn)
}

export function useDerivedBurnInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  pairAddress: string | undefined
): {
  dependentField: Field
  currencies: { [field in Field]?: Currency }
  pair?: Pair | null
  userLiquidity?: TokenAmount
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: CurrencyAmount
    [Field.CURRENCY_B]?: CurrencyAmount
  }
  amountsMin: {
    [Field.CURRENCY_A]?: JSBI
    [Field.CURRENCY_B]?: JSBI
  }
  price?: Price
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()

  const { independentField, typedValue } = useBurnState()
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )

  const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]

  let error: string | undefined

  // pair + totalsupply
  const [, pair] = usePairByAddress(tokenA, tokenB, pairAddress)

  const [allowedSlippage] = useUserSlippageTolerance()

  // balances
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [pair?.liquidityToken])
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[pair?.liquidityToken?.address ?? '']

  const tokens = {
    [Field.CURRENCY_A]: tokenA,
    [Field.CURRENCY_B]: tokenB,
    [Field.LIQUIDITY]: pair?.liquidityToken
  }

  // liquidity values
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const liquidityValueA =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenA &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupply, userLiquidity).raw)
      : undefined
  const liquidityValueB =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenB &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupply, userLiquidity).raw)
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
      if (independentAmount && userLiquidity && independentAmount.greaterThan(userLiquidity)) {
        error = error ?? t`Insufficient balance`
      }

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

  const amountsMin = {
    [Field.CURRENCY_A]:
      parsedAmounts && parsedAmounts[Field.CURRENCY_A]
        ? calculateSlippageAmount(parsedAmounts[Field.CURRENCY_A] as CurrencyAmount, allowedSlippage)[0]
        : undefined,
    [Field.CURRENCY_B]:
      parsedAmounts && parsedAmounts[Field.CURRENCY_B]
        ? calculateSlippageAmount(parsedAmounts[Field.CURRENCY_B] as CurrencyAmount, allowedSlippage)[0]
        : undefined
  }

  const price = useMemo(() => {
    const wrappedCurrencyA = wrappedCurrency(currencyA, chainId)
    return pair && wrappedCurrencyA ? pair.priceOf(wrappedCurrencyA) : undefined
  }, [chainId, currencyA, pair])

  if (!account) {
    error = t`Connect wallet`
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? t`Enter an amount`
  }

  if (userLiquidity && parsedAmounts[Field.LIQUIDITY]?.greaterThan(userLiquidity)) {
    error = error ?? t`Insufficient balance`
  }

  return { dependentField, currencies, pair, userLiquidity, parsedAmounts, amountsMin, price, error }
}

export function useBurnActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useAppDispatch()

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

export function useDerivedZapOutInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  pairAddress: string | undefined
): {
  dependentTokenField: Field
  currencies: { [field in Field]?: Currency }
  pair?: Pair | null
  userLiquidity?: TokenAmount
  noZapAmounts: {
    [field in Field]?: TokenAmount
  }
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: TokenAmount
    [Field.CURRENCY_B]?: TokenAmount
  }
  amountsMin: {
    [Field.CURRENCY_A]: JSBI
    [Field.CURRENCY_B]: JSBI
  }
  insufficientLiquidity: boolean
  price?: Price
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()

  const { independentField, independentTokenField, typedValue } = useBurnState()
  const dependentTokenField = independentTokenField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )

  const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]

  const tokenIn = independentTokenField === Field.CURRENCY_A ? tokenB : tokenA
  const tokenOut = independentTokenField === Field.CURRENCY_A ? tokenA : tokenB

  let insufficientLiquidity = false
  let error: string | undefined

  // pair + totalsupply
  const [, pair] = usePairByAddress(tokenA, tokenB, pairAddress)

  const [allowedSlippage] = useUserSlippageTolerance()

  // balances
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [pair?.liquidityToken])
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[pair?.liquidityToken?.address ?? '']

  const tokens = {
    [Field.CURRENCY_A]: tokenA,
    [Field.CURRENCY_B]: tokenB,
    [Field.LIQUIDITY]: pair?.liquidityToken
  }

  // liquidity values
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const liquidityValueA =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenA &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupply, userLiquidity).raw)
      : undefined
  const liquidityValueB =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenB &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupply, userLiquidity).raw)
      : undefined
  const liquidityValues: { [field in Field]?: TokenAmount } = {
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

      if (independentAmount && userLiquidity && independentAmount.greaterThan(userLiquidity)) {
        error = error ?? t`Insufficient balance`
      }

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

  const lpQty = useMemo(() => {
    if (!userLiquidity) {
      return BigNumber.from('0')
    }

    const liquidityToRemove = JSBI.divide(
      JSBI.multiply(userLiquidity.raw, percentToRemove.numerator),
      percentToRemove.denominator
    )

    return BigNumber.from(liquidityToRemove.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLiquidity?.raw.toString(), percentToRemove.numerator.toString(), percentToRemove.denominator.toString()])

  const zapOutAmount = useZapOutAmount(tokenIn?.address, tokenOut?.address, pair?.address, lpQty)

  // amounts
  const independentTokenAmount: CurrencyAmount | undefined = tryParseAmount(
    zapOutAmount.amount.toString(),
    currencies[independentTokenField],
    false
  )

  const dependentTokenAmount: CurrencyAmount | undefined = useMemo(() => {
    if (independentTokenAmount && liquidityValueA && liquidityValueB) {
      const amount =
        dependentTokenField === Field.CURRENCY_A
          ? JSBI.divide(JSBI.multiply(liquidityValueA.raw, percentToRemove.numerator), percentToRemove.denominator)
          : JSBI.divide(JSBI.multiply(liquidityValueB.raw, percentToRemove.numerator), percentToRemove.denominator)

      return tryParseAmount(amount.toString(), currencies[dependentTokenField], false)
    } else {
      return undefined
    }
  }, [
    independentTokenAmount,
    liquidityValueA,
    liquidityValueB,
    dependentTokenField,
    percentToRemove.numerator,
    percentToRemove.denominator,
    currencies
  ])

  const noZapAmounts: {
    [Field.CURRENCY_A]?: TokenAmount
    [Field.CURRENCY_B]?: TokenAmount
  } = {
    [Field.CURRENCY_A]:
      tokenA && liquidityValueA && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokenA, percentToRemove.multiply(liquidityValueA.raw).quotient)
        : undefined,
    [Field.CURRENCY_B]:
      tokenB && liquidityValueB && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokenB, percentToRemove.multiply(liquidityValueB.raw).quotient)
        : undefined
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
    [independentTokenField]:
      tokenOut && independentTokenAmount ? new TokenAmount(tokenOut, independentTokenAmount.raw) : undefined,
    [dependentTokenField]:
      tokenIn && dependentTokenAmount ? new TokenAmount(tokenIn, dependentTokenAmount.raw) : undefined
  }

  const amountsMin = {
    [Field.CURRENCY_A]:
      parsedAmounts && parsedAmounts[Field.CURRENCY_A]
        ? calculateSlippageAmount(parsedAmounts[Field.CURRENCY_A] as CurrencyAmount, allowedSlippage)[0]
        : JSBI.BigInt(0),
    [Field.CURRENCY_B]:
      parsedAmounts && parsedAmounts[Field.CURRENCY_B]
        ? calculateSlippageAmount(parsedAmounts[Field.CURRENCY_B] as CurrencyAmount, allowedSlippage)[0]
        : JSBI.BigInt(0)
  }

  const price = useMemo(() => {
    const wrappedCurrencyA = wrappedCurrency(currencyA, chainId)
    return pair && wrappedCurrencyA ? pair.priceOf(wrappedCurrencyA) : undefined
  }, [chainId, currencyA, pair])

  if (!account) {
    error = t`Connect wallet`
  }

  if (!typedValue && !parsedAmounts[Field.LIQUIDITY]) {
    error = error ?? t`Enter an amount`
  }

  if (typedValue && !parsedAmounts[Field.LIQUIDITY]) {
    error = error ?? t`Invalid amount`
  }

  if (userLiquidity && parsedAmounts[Field.LIQUIDITY]?.greaterThan(userLiquidity)) {
    error = error ?? t`Insufficient balance`
  }

  if (
    zapOutAmount.error &&
    (zapOutAmount.error.message.includes('INSUFFICIENT_LIQUIDITY') ||
      zapOutAmount.error.data?.message.includes('INSUFFICIENT_LIQUIDITY'))
  ) {
    insufficientLiquidity = true
  }

  if (zapOutAmount.error && !insufficientLiquidity) {
    error = t`Something went wrong`
  }

  return {
    dependentTokenField,
    currencies,
    pair,
    userLiquidity,
    noZapAmounts,
    parsedAmounts,
    amountsMin,
    insufficientLiquidity,
    price,
    error
  }
}

export function useZapOutActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
  onSwitchField: () => void
} {
  const dispatch = useAppDispatch()
  const { independentTokenField } = useBurnState()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onSwitchField = useCallback(() => {
    dispatch(
      switchTokenField({ field: independentTokenField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A })
    )
  }, [dispatch, independentTokenField])

  return {
    onUserInput,
    onSwitchField
  }
}
