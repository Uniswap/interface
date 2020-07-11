import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Token, TokenAmount, Route, JSBI, Price, Percent, Pair, CurrencyAmount, Currency } from '@uniswap/sdk'

import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, typeInput } from './actions'
import { usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'
import { tryParseAmount } from '../swap/hooks'

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

  const dependentField = independentField === Field.TOKEN_A ? Field.TOKEN_B : Field.TOKEN_A

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.TOKEN_A]: currencyA ?? undefined,
      [Field.TOKEN_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )

  // pair
  const pair = usePair(currencies[Field.TOKEN_A], currencies[Field.TOKEN_B])
  const noLiquidity =
    pair === null || (!!pair && JSBI.equal(pair.reserve0.raw, ZERO) && JSBI.equal(pair.reserve1.raw, ZERO))

  // route
  const route = useMemo(
    () =>
      !noLiquidity && pair && currencies[independentField]
        ? new Route([pair], currencies[Field.TOKEN_A] as Token)
        : undefined,
    [noLiquidity, pair, currencies, independentField]
  )

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [currencies[Field.TOKEN_A], currencies[Field.TOKEN_B]])
  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.TOKEN_A]: balances[0],
    [Field.TOKEN_B]: balances[1]
  }

  // amounts
  const independentAmount = tryParseAmount(typedValue, currencies[independentField])
  const dependentAmount = useMemo(() => {
    if (noLiquidity && otherTypedValue && currencies[dependentField]) {
      return tryParseAmount(otherTypedValue, currencies[dependentField])
    } else if (route && independentAmount) {
      return dependentField === Field.TOKEN_B
        ? route.midPrice.quote(independentAmount)
        : route.midPrice.invert().quote(independentAmount)
    } else {
      return
    }
  }, [noLiquidity, otherTypedValue, currencies, dependentField, independentAmount, route])
  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.TOKEN_A]: independentField === Field.TOKEN_A ? independentAmount : dependentAmount,
    [Field.TOKEN_B]: independentField === Field.TOKEN_A ? dependentAmount : independentAmount
  }

  const price = useMemo(() => {
    const { [Field.TOKEN_A]: tokenAAmount, [Field.TOKEN_B]: tokenBAmount } = parsedAmounts
    if (noLiquidity && currencies[Field.TOKEN_A] && currencies[Field.TOKEN_B] && tokenAAmount && tokenBAmount) {
      return new Price(
        currencies[Field.TOKEN_A] as Token,
        currencies[Field.TOKEN_B] as Token,
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
    if (pair && totalSupply && parsedAmounts[Field.TOKEN_A] && parsedAmounts[Field.TOKEN_B]) {
      return pair.getLiquidityMinted(
        totalSupply,
        parsedAmounts[Field.TOKEN_A] as TokenAmount,
        parsedAmounts[Field.TOKEN_B] as TokenAmount
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

  if (!parsedAmounts[Field.TOKEN_A] || !parsedAmounts[Field.TOKEN_B]) {
    error = error ?? 'Enter an amount'
  }

  if (
    parsedAmounts[Field.TOKEN_A] &&
    currencyBalances?.[Field.TOKEN_A]?.lessThan(parsedAmounts[Field.TOKEN_A] as TokenAmount)
  ) {
    error = 'Insufficient ' + currencies[Field.TOKEN_A]?.symbol + ' balance'
  }

  if (
    parsedAmounts[Field.TOKEN_B] &&
    currencyBalances?.[Field.TOKEN_B]?.lessThan(parsedAmounts[Field.TOKEN_B] as TokenAmount)
  ) {
    error = 'Insufficient ' + currencies[Field.TOKEN_B]?.symbol + ' balance'
  }

  return {
    dependentField,
    currencies,
    pair,
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
      dispatch(typeInput({ field: Field.TOKEN_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )
  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.TOKEN_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  return {
    onFieldAInput,
    onFieldBInput
  }
}
