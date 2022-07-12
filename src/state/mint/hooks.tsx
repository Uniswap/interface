import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ReactNode, useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { useTotalSupply } from '../../hooks/useTotalSupply'
import { PairState, useV2Pair } from '../../hooks/useV2Pairs'
import { useCurrencyBalances } from '../connection/hooks'
import { AppState } from '../index'
import { Field, typeInput } from './actions'

const ZERO = JSBI.BigInt(0)

export function useMintState(): AppState['mint'] {
  return useAppSelector((state) => state.mint)
}

export function useMintActionHandlers(noLiquidity: boolean | undefined): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
} {
  const dispatch = useAppDispatch()

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
    onFieldBInput,
  }
}

export function useDerivedMintInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  dependentField: Field
  currencies: { [field in Field]?: Currency }
  pair?: Pair | null
  pairState: PairState
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  price?: Price<Currency, Currency>
  noLiquidity?: boolean
  liquidityMinted?: CurrencyAmount<Token>
  poolTokenPercentage?: Percent
  error?: ReactNode
} {
  const { account } = useWeb3React()

  const { independentField, typedValue, otherTypedValue } = useMintState()

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB]
  )

  // pair
  const [pairState, pair] = useV2Pair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B])
  const totalSupply = useTotalSupply(pair?.liquidityToken)

  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(totalSupply && JSBI.equal(totalSupply.quotient, ZERO)) ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve0.quotient, ZERO) &&
        JSBI.equal(pair.reserve1.quotient, ZERO)
    )

  // balances
  const balances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies])
  )
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1],
  }

  // amounts
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseCurrencyAmount(
    typedValue,
    currencies[independentField]
  )
  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    if (noLiquidity) {
      if (otherTypedValue && currencies[dependentField]) {
        return tryParseCurrencyAmount(otherTypedValue, currencies[dependentField])
      }
      return undefined
    } else if (independentAmount) {
      // we wrap the currencies just to get the price in terms of the other token
      const wrappedIndependentAmount = independentAmount?.wrapped
      const [tokenA, tokenB] = [currencyA?.wrapped, currencyB?.wrapped]
      if (tokenA && tokenB && wrappedIndependentAmount && pair) {
        const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA
        const dependentTokenAmount =
          dependentField === Field.CURRENCY_B
            ? pair.priceOf(tokenA).quote(wrappedIndependentAmount)
            : pair.priceOf(tokenB).quote(wrappedIndependentAmount)
        return dependentCurrency?.isNative
          ? CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
          : dependentTokenAmount
      }
      return undefined
    } else {
      return undefined
    }
  }, [noLiquidity, otherTypedValue, currencies, dependentField, independentAmount, currencyA, currencyB, pair])

  const parsedAmounts: { [field in Field]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    }
  }, [dependentAmount, independentAmount, independentField])

  const price = useMemo(() => {
    if (noLiquidity) {
      const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
      if (currencyAAmount?.greaterThan(0) && currencyBAmount?.greaterThan(0)) {
        const value = currencyBAmount.divide(currencyAAmount)
        return new Price(currencyAAmount.currency, currencyBAmount.currency, value.denominator, value.numerator)
      }
      return undefined
    } else {
      const wrappedCurrencyA = currencyA?.wrapped
      return pair && wrappedCurrencyA ? pair.priceOf(wrappedCurrencyA) : undefined
    }
  }, [currencyA, noLiquidity, pair, parsedAmounts])

  // liquidity minted
  const liquidityMinted = useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
    const [tokenAmountA, tokenAmountB] = [currencyAAmount?.wrapped, currencyBAmount?.wrapped]
    if (pair && totalSupply && tokenAmountA && tokenAmountB) {
      try {
        return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB)
      } catch (error) {
        console.error(error)
        return undefined
      }
    } else {
      return undefined
    }
  }, [parsedAmounts, pair, totalSupply])

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.quotient, totalSupply.add(liquidityMinted).quotient)
    } else {
      return undefined
    }
  }, [liquidityMinted, totalSupply])

  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }

  if (pairState === PairState.INVALID) {
    error = error ?? <Trans>Invalid pair</Trans>
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? <Trans>Enter an amount</Trans>
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    error = <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</Trans>
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    error = <Trans>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance</Trans>
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
    error,
  }
}
