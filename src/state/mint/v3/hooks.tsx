import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Price, Rounding, Token } from '@uniswap/sdk-core'
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  Pool,
  Position,
  priceToClosestTick,
  TICK_SPACINGS,
  TickMath,
  tickToPrice,
} from '@uniswap/v3-sdk'
import { usePool } from 'hooks/usePools'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useNetworkGasPrice, useUserGasPrice } from 'state/user/hooks'
import { getTickToPrice } from 'utils/getTickToPrice'

import { BIG_INT_ZERO } from '../../../constants/misc'
import { PoolState } from '../../../hooks/usePools'
import { useActiveWeb3React } from '../../../hooks/web3'
import { AppState } from '../../index'
import { tryParseAmount } from '../../swap/hooks'
import { useCurrencyBalances } from '../../wallet/hooks'
import {
  Bound,
  Field,
  setFullRange,
  typeInput,
  typeLeftRangeInput,
  typeRightRangeInput,
  typeStartPriceInput,
} from './actions'
import { tryParseTick } from './utils'

export function useV3MintState(): AppState['mintV3'] {
  return useAppSelector((state) => state.mintV3)
}

export function useV3MintActionHandlers(noLiquidity: boolean | undefined): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  onStartPriceInput: (typedValue: string) => void
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

  const onLeftRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeLeftRangeInput({ typedValue }))
    },
    [dispatch]
  )

  const onRightRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeRightRangeInput({ typedValue }))
    },
    [dispatch]
  )

  const onStartPriceInput = useCallback(
    (typedValue: string) => {
      dispatch(typeStartPriceInput({ typedValue }))
    },
    [dispatch]
  )

  return {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
  }
}

export function useV3DerivedMintInfo(
  currencyA?: Currency,
  baseCurrency?: Currency
): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  errorMessage?: ReactNode
  depositADisabled: boolean
} {
  const { account } = useActiveWeb3React()

  const { independentField, typedValue } = useV3MintState()

  // currencies
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
    }),
    [currencyA]
  )

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [currencies[Field.CURRENCY_A]])
  const currencyBalances: { [field in Field.CURRENCY_A]?: CurrencyAmount<Currency> } = {
    [Field.CURRENCY_A]: balances[0],
  }

  // amounts
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(
    typedValue,
    currencies[independentField]
  )

  const parsedAmounts: { [field in Field.CURRENCY_A]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : undefined,
    }
  }, [independentAmount, independentField])

  let errorMessage: ReactNode | undefined
  if (!account) {
    errorMessage = <Trans>Connect Wallet</Trans>
  }

  if (!parsedAmounts[Field.CURRENCY_A]) {
    errorMessage = errorMessage ?? <Trans>Enter an amount</Trans>
  }

  const { [Field.CURRENCY_A]: currencyAAmount } = parsedAmounts

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    errorMessage = <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</Trans>
  }

  return {
    currencies,
    currencyBalances,
    parsedAmounts,
    errorMessage,
    depositADisabled: false,
  }
}

export function useRangeHopCallbacks(
  baseCurrency: Currency | undefined,
  quoteCurrency: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  tickLower: number | undefined,
  tickUpper: number | undefined,
  pool?: Pool | undefined | null
) {
  const dispatch = useAppDispatch()

  const baseToken = useMemo(() => baseCurrency?.wrapped, [baseCurrency])
  const quoteToken = useMemo(() => quoteCurrency?.wrapped, [quoteCurrency])

  const getDecrementLower = useCallback(() => {
    if (baseToken && quoteToken && typeof tickLower === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickLower - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickLower === 'number') && baseToken && quoteToken && feeAmount && pool) {
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickLower, feeAmount, pool])

  const getIncrementLower = useCallback(() => {
    if (baseToken && quoteToken && typeof tickLower === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickLower + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickLower === 'number') && baseToken && quoteToken && feeAmount && pool) {
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickLower, feeAmount, pool])

  const getDecrementUpper = useCallback(() => {
    if (baseToken && quoteToken && typeof tickUpper === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickUpper - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickUpper === 'number') && baseToken && quoteToken && feeAmount && pool) {
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickUpper, feeAmount, pool])

  const getIncrementUpper = useCallback(() => {
    if (baseToken && quoteToken && typeof tickUpper === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickUpper + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickUpper === 'number') && baseToken && quoteToken && feeAmount && pool) {
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickUpper, feeAmount, pool])

  const getSetFullRange = useCallback(() => {
    dispatch(setFullRange())
  }, [dispatch])

  return { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange }
}
