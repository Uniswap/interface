import {
  ChainId,
  Currency,
  CurrencyAmount,
  ETHER,
  JSBI,
  Pair,
  Percent,
  Price,
  TokenAmount,
  WETH
} from '@dynamic-amm/sdk'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { convertToNativeTokenFromETH } from 'utils/dmm'
import { PairState, usePairByAddress, useUnAmplifiedPair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { wrappedCurrency, wrappedCurrencyAmount } from '../../utils/wrappedCurrency'
import { AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, switchTokenField, typeInput } from './actions'
import { useZapInAmounts } from 'hooks/useZap'
import { useAppDispatch } from 'state/hooks'

const ZERO = JSBI.BigInt(0)

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint)
}

export function useDerivedMintInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  pairAddress: string | undefined
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
  unAmplifiedPairAddress?: string
} {
  const { account, chainId } = useActiveWeb3React()

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
  const tokenA = wrappedCurrency(currencies[Field.CURRENCY_A], chainId)
  const tokenB = wrappedCurrency(currencies[Field.CURRENCY_B], chainId)
  const [pairState, pair] = usePairByAddress(tokenA, tokenB, pairAddress)
  const unAmplifiedPairAddress = useUnAmplifiedPair(tokenA, tokenB)
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const noLiquidity: boolean =
    (pairState === PairState.NOT_EXISTS || Boolean(totalSupply && JSBI.equal(totalSupply.raw, ZERO))) &&
    (tokenA?.symbol !== WETH[chainId as ChainId].symbol || tokenB?.symbol !== WETH[chainId as ChainId].symbol)

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
  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])

  const dependentAmount: CurrencyAmount | undefined = useMemo(() => {
    if (noLiquidity) {
      if (otherTypedValue && currencies[dependentField]) {
        return tryParseAmount(otherTypedValue, currencies[dependentField])
      }
      return undefined
    } else if (independentAmount) {
      // we wrap the currencies just to get the price in terms of the other token
      const wrappedIndependentAmount = wrappedCurrencyAmount(independentAmount, chainId)
      const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]

      if (tokenA && tokenB && wrappedIndependentAmount && pair) {
        const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA
        const dependentTokenAmount =
          dependentField === Field.CURRENCY_B
            ? pair.priceOfReal(tokenA).quote(wrappedIndependentAmount)
            : pair.priceOfReal(tokenB).quote(wrappedIndependentAmount)
        return dependentCurrency === ETHER ? CurrencyAmount.ether(dependentTokenAmount.raw) : dependentTokenAmount
      }
      return undefined
    } else {
      return undefined
    }
  }, [noLiquidity, otherTypedValue, currencies, dependentField, independentAmount, currencyA, chainId, currencyB, pair])
  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
    [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount
  }

  const price = useMemo(() => {
    if (noLiquidity) {
      const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
      if (currencyAAmount && currencyBAmount) {
        return new Price(currencyAAmount.currency, currencyBAmount.currency, currencyAAmount.raw, currencyBAmount.raw)
      }
      return undefined
    } else {
      const wrappedCurrencyA = wrappedCurrency(currencyA, chainId)
      return pair && wrappedCurrencyA ? pair.priceOf(wrappedCurrencyA) : undefined
    }
  }, [chainId, currencyA, noLiquidity, pair, parsedAmounts])

  // liquidity minted
  const liquidityMinted = useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
    const [tokenAmountA, tokenAmountB] = [
      wrappedCurrencyAmount(currencyAAmount, chainId),
      wrappedCurrencyAmount(currencyBAmount, chainId)
    ]

    if (pair && totalSupply && tokenAmountA && tokenAmountB) {
      try {
        return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB)
      } catch (e) {
        console.error(e)
        return undefined
      }
    } else {
      return undefined
    }
  }, [parsedAmounts, chainId, pair, totalSupply])

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
    } else {
      return undefined
    }
  }, [liquidityMinted, totalSupply])

  let error: string | undefined
  if (!account) {
    error = t`Connect wallet`
  }

  if ((pairAddress && pairState === PairState.INVALID) || (tokenA?.symbol === 'WETH' && tokenB?.symbol === 'WETH')) {
    error = error ?? 'Invalid pair'
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  if (
    (!currencyAAmount && typedValue) ||
    (!currencyBAmount && otherTypedValue) ||
    currencyBAmount?.toExact() === '0' ||
    currencyAAmount?.toExact() === '0'
  ) {
    error = error ?? t`Invalid amount`
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? t`Enter an amount`
  }

  const cA = currencies[Field.CURRENCY_A]
  const cB = currencies[Field.CURRENCY_B]
  if (!!cA && currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    error = t`Insufficient ${convertToNativeTokenFromETH(cA, chainId).symbol} balance`
  }

  if (!!cB && currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    error = t`Insufficient ${convertToNativeTokenFromETH(cB, chainId).symbol} balance`
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
    unAmplifiedPairAddress
  }
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined
): {
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
    onFieldBInput
  }
}

export function useDerivedZapInInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  pairAddress: string | undefined
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
  insufficientLiquidity?: boolean
  error?: string
  unAmplifiedPairAddress?: string
} {
  const { account, chainId } = useActiveWeb3React()

  const { independentField, typedValue } = useMintState()
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
  const tokenA = wrappedCurrency(currencies[Field.CURRENCY_A], chainId)
  const tokenB = wrappedCurrency(currencies[Field.CURRENCY_B], chainId)
  const [pairState, pair] = usePairByAddress(tokenA, tokenB, pairAddress)
  const unAmplifiedPairAddress = useUnAmplifiedPair(tokenA, tokenB)
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const noLiquidity: boolean =
    (pairState === PairState.NOT_EXISTS || Boolean(totalSupply && JSBI.equal(totalSupply.raw, ZERO))) &&
    (tokenA?.symbol !== WETH[chainId as ChainId].symbol || tokenB?.symbol !== WETH[chainId as ChainId].symbol)

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [
    currencies[Field.CURRENCY_A],
    currencies[Field.CURRENCY_B]
  ])
  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1]
  }

  const userInCurrencyAmount = useMemo(() => {
    return tryParseAmount(typedValue, currencies[independentField], true)
  }, [currencies, independentField, typedValue])

  const userIn = useMemo(() => {
    return userInCurrencyAmount ? BigNumber.from(userInCurrencyAmount.raw.toString()) : undefined
  }, [userInCurrencyAmount])

  const zapInAmounts = useZapInAmounts(
    dependentField === Field.CURRENCY_B ? tokenA?.address : tokenB?.address,
    dependentField === Field.CURRENCY_B ? tokenB?.address : tokenA?.address,
    pair?.address,
    userIn
  )

  // amounts
  const independentAmount: CurrencyAmount | undefined = tryParseAmount(
    zapInAmounts.amounts.tokenInAmount.toString(),
    currencies[independentField],
    false
  )

  const dependentAmount: CurrencyAmount | undefined = useMemo(() => {
    if (independentAmount) {
      // we wrap the currencies just to get the price in terms of the other token
      const wrappedIndependentAmount = wrappedCurrencyAmount(independentAmount, chainId)
      const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]

      if (tokenA && tokenB && wrappedIndependentAmount && pair) {
        const dependentTokenAmount = tryParseAmount(
          zapInAmounts.amounts.tokenOutAmount.toString(),
          currencies[dependentField],
          false
        )

        return dependentTokenAmount
      }

      return undefined
    } else {
      return undefined
    }
  }, [
    independentAmount,
    chainId,
    currencyA,
    currencyB,
    pair,
    zapInAmounts.amounts.tokenOutAmount,
    currencies,
    dependentField
  ])

  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
    [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount
  }

  const price = useMemo(() => {
    const wrappedCurrencyA = wrappedCurrency(currencyA, chainId)
    return pair && wrappedCurrencyA ? pair.priceOf(wrappedCurrencyA) : undefined
  }, [chainId, currencyA, pair])

  // liquidity minted
  const liquidityMinted = useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
    const [tokenAmountA, tokenAmountB] = [
      wrappedCurrencyAmount(currencyAAmount, chainId),
      wrappedCurrencyAmount(currencyBAmount, chainId)
    ]

    if (pair && totalSupply && tokenAmountA && tokenAmountB) {
      try {
        return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB)
      } catch (e) {
        console.error(e)
        return undefined
      }
    } else {
      return undefined
    }
  }, [parsedAmounts, chainId, pair, totalSupply])

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
    } else {
      return undefined
    }
  }, [liquidityMinted, totalSupply])

  let insufficientLiquidity = false
  let error: string | undefined
  if (!account) {
    error = t`Connect wallet`
  }

  if ((pairAddress && pairState === PairState.INVALID) || (tokenA?.symbol === 'WETH' && tokenB?.symbol === 'WETH')) {
    error = error ?? 'Invalid pair'
  }

  if (!typedValue && (!parsedAmounts[independentField] || !parsedAmounts[dependentField])) {
    error = error ?? t`Enter an amount`
  }

  if (
    (!parsedAmounts[independentField] && typedValue) ||
    parsedAmounts[independentField]?.toExact() === '0' ||
    parsedAmounts[dependentField]?.toExact() === '0'
  ) {
    error = error ?? t`Invalid amount`
  }

  const selectedCurrency = currencies[independentField]
  if (
    !!selectedCurrency &&
    independentAmount &&
    userInCurrencyAmount &&
    (currencyBalances?.[independentField]?.lessThan(independentAmount) ||
      currencyBalances?.[independentField]?.lessThan(userInCurrencyAmount))
  ) {
    error = t`Insufficient ${convertToNativeTokenFromETH(selectedCurrency, chainId).symbol} balance`
  }

  if (zapInAmounts.error && zapInAmounts.error.message.includes('INSUFFICIENT_LIQUIDITY')) {
    insufficientLiquidity = true
  }

  if (zapInAmounts.error && !zapInAmounts.error.message.includes('INSUFFICIENT_LIQUIDITY')) {
    error = t`Something went wrong`
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
    insufficientLiquidity,
    error,
    unAmplifiedPairAddress
  }
}

export function useZapInActionHandlers(): {
  onFieldInput: (typedValue: string) => void
  onSwitchField: () => void
} {
  const dispatch = useAppDispatch()
  const { independentField } = useMintState()

  const onFieldInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: independentField, typedValue, noLiquidity: false }))
    },
    [dispatch, independentField]
  )

  const onSwitchField = useCallback(() => {
    dispatch(switchTokenField({ field: independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A }))
  }, [dispatch, independentField])

  return {
    onFieldInput,
    onSwitchField
  }
}
