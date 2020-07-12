import { Currency, CurrencyAmount, JSBI, Pair, Percent, Price, Route, Token, TokenAmount } from '@uniswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PairState, usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, typeInput } from './actions'

const ZERO = JSBI.BigInt(0)

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint)
}

export function useDerivedMintInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  dependentField: Field
  currencies: { [field in Field]?: Currency }
  pair?: Pair | null
  pairState: PairState
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  price?: Price
  noLiquidity?: boolean
  liquidityMinted?: TokenAmount
  poolTokenPercentage?: Percent
  error?: string
} {
  const { account } = useActiveWeb3React()

  const { independentField, typedValue, otherTypedValue } = useMintState()

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )

  // pair
  const [pairState, pair] = usePair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B])
  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(pair && JSBI.equal(pair.reserve0.raw, ZERO) && JSBI.equal(pair.reserve1.raw, ZERO))

  // route
  const route = useMemo(
    () =>
      !noLiquidity && pair && currencies[independentField]
        ? new Route([pair], currencies[Field.CURRENCY_A] as Token)
        : undefined,
    [noLiquidity, pair, currencies, independentField]
  )

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [
    currencies[Field.CURRENCY_A],
    currencies[Field.CURRENCY_B]
  ])
  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1]
  }

  // amounts
  const independentAmount = tryParseAmount(typedValue, currencies[independentField])
  const dependentAmount = useMemo(() => {
    if (noLiquidity && otherTypedValue && currencies[dependentField]) {
      return tryParseAmount(otherTypedValue, currencies[dependentField])
    } else if (route && independentAmount) {
      return dependentField === Field.CURRENCY_B
        ? route.midPrice.quote(independentAmount)
        : route.midPrice.invert().quote(independentAmount)
    } else {
      return
    }
  }, [noLiquidity, otherTypedValue, currencies, dependentField, independentAmount, route])
  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
    [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount
  }

  const price = useMemo(() => {
    const { [Field.CURRENCY_A]: tokenAAmount, [Field.CURRENCY_B]: tokenBAmount } = parsedAmounts
    if (noLiquidity && currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && tokenAAmount && tokenBAmount) {
      return new Price(
        currencies[Field.CURRENCY_A] as Token,
        currencies[Field.CURRENCY_B] as Token,
        tokenAAmount.raw,
        tokenBAmount.raw
      )
    } else if (route) {
      return route.midPrice
    } else {
      return
    }
  }, [noLiquidity, currencies, parsedAmounts, route])

  // liquidity minted
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const liquidityMinted = useMemo(() => {
    if (pair && totalSupply && parsedAmounts[Field.CURRENCY_A] && parsedAmounts[Field.CURRENCY_B]) {
      return pair.getLiquidityMinted(
        totalSupply,
        parsedAmounts[Field.CURRENCY_A] as TokenAmount,
        parsedAmounts[Field.CURRENCY_B] as TokenAmount
      )
    } else {
      return
    }
  }, [pair, totalSupply, parsedAmounts])

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
    } else {
      return
    }
  }, [liquidityMinted, totalSupply])

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (pairState === PairState.INVALID) {
    error = error ?? 'Invalid pair'
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  if (
    parsedAmounts[Field.CURRENCY_A] &&
    currencyBalances?.[Field.CURRENCY_A]?.lessThan(parsedAmounts[Field.CURRENCY_A] as TokenAmount)
  ) {
    error = 'Insufficient ' + currencies[Field.CURRENCY_A]?.symbol + ' balance'
  }

  if (
    parsedAmounts[Field.CURRENCY_B] &&
    currencyBalances?.[Field.CURRENCY_B]?.lessThan(parsedAmounts[Field.CURRENCY_B] as TokenAmount)
  ) {
    error = 'Insufficient ' + currencies[Field.CURRENCY_B]?.symbol + ' balance'
  }

  return {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  }
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined
): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )
  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  return {
    onFieldAInput,
    onFieldBInput
  }
}
