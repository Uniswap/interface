import { Currency, CurrencyAmount, Percent, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { ReactNode, useCallback, useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import { useProAmmPositionFees } from 'hooks/useProAmmPositionFees'
import { AppState } from 'state'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { PositionDetails } from 'types/position'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { Field, typeInput } from './actions'

export function useBurnProAmmState(): AppState['burnProAmm'] {
  return useAppSelector(state => state.burnProAmm)
}

export function useDerivedProAmmBurnInfo(
  position?: PositionDetails,
  asWETH = false,
): {
  position?: Position
  liquidityPercentage?: Percent
  liquidityValue0?: CurrencyAmount<Currency>
  liquidityValue1?: CurrencyAmount<Currency>
  pooledAmount0?: CurrencyAmount<Currency>
  pooledAmount1?: CurrencyAmount<Currency>
  feeValue0?: CurrencyAmount<Currency>
  feeValue1?: CurrencyAmount<Currency>
  outOfRange: boolean
  error?: ReactNode
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.CURRENCY_A]?: CurrencyAmount<Currency>
    [Field.CURRENCY_B]?: CurrencyAmount<Currency>
  }
} {
  const { account } = useActiveWeb3React()
  const { independentField, typedValue } = useBurnProAmmState()

  const token0 = useToken(position?.token0)
  const token1 = useToken(position?.token1)
  const tokens = {
    [Field.CURRENCY_A]: token0,
    [Field.CURRENCY_B]: token1,
  }
  const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.fee)

  const positionSDK = useMemo(
    () =>
      pool && position?.liquidity && typeof position?.tickLower === 'number' && typeof position?.tickUpper === 'number'
        ? new Position({
            pool,
            liquidity: position.liquidity.toString(),
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
          })
        : undefined,
    [pool, position],
  )

  const liquidityValues: {
    [Field.CURRENCY_A]?: CurrencyAmount<Token>
    [Field.CURRENCY_B]?: CurrencyAmount<Token>
  } = {
    [Field.CURRENCY_A]: positionSDK && positionSDK.amount0,
    [Field.CURRENCY_B]: positionSDK && positionSDK.amount1,
  }
  let liquidityPercentage: Percent = new Percent('0', '100')
  if (independentField === Field.LIQUIDITY_PERCENT) {
    liquidityPercentage = new Percent(typedValue, '100')
  }
  // user specified a specific amount of token a or b
  else {
    if (!!tokens[independentField]) {
      const independentAmount = tryParseAmount(typedValue, tokens[independentField] ?? undefined)
      const liquidityValue = liquidityValues[independentField]
      if (independentAmount && liquidityValue && !independentAmount.greaterThan(liquidityValue)) {
        liquidityPercentage = new Percent(independentAmount.quotient, liquidityValue.quotient)
      }
    }
  }

  const discountedAmount0 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount0.quotient).quotient
    : undefined
  const discountedAmount1 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount1.quotient).quotient
    : undefined

  const liquidityValue0 =
    token0 && discountedAmount0
      ? CurrencyAmount.fromRawAmount(asWETH ? token0 : unwrappedToken(token0), discountedAmount0)
      : undefined
  const liquidityValue1 =
    token1 && discountedAmount1
      ? CurrencyAmount.fromRawAmount(asWETH ? token1 : unwrappedToken(token1), discountedAmount1)
      : undefined

  const outOfRange =
    pool && position ? pool.tickCurrent < position.tickLower || pool.tickCurrent > position.tickUpper : false
  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }
  // if (percent === 0) {
  //   error = error ?? <Trans>Enter a percent</Trans>
  // }

  const [feeValue0, feeValue1] = useProAmmPositionFees(
    position?.tokenId,
    pool && position
      ? new Position({
          pool: pool,
          liquidity: position.liquidity.toString(),
          tickLower: position.tickLower,
          tickUpper: position.tickUpper,
        })
      : undefined,
    asWETH,
  )

  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.CURRENCY_A]?: TokenAmount
    [Field.CURRENCY_B]?: TokenAmount
  } = {
    [Field.LIQUIDITY_PERCENT]: liquidityPercentage,
    [Field.CURRENCY_A]:
      token0 && liquidityPercentage && liquidityPercentage.greaterThan('0') && liquidityValue0 && positionSDK
        ? TokenAmount.fromRawAmount(token0.wrapped, liquidityPercentage.multiply(positionSDK.amount0.quotient).quotient)
        : undefined,
    [Field.CURRENCY_B]:
      token1 && liquidityPercentage && liquidityPercentage.greaterThan('0') && liquidityValue1 && positionSDK
        ? TokenAmount.fromRawAmount(token1.wrapped, liquidityPercentage.multiply(positionSDK.amount1.quotient).quotient)
        : undefined,
  }

  return {
    position: positionSDK,
    pooledAmount0: liquidityValues[Field.CURRENCY_A],
    pooledAmount1: liquidityValues[Field.CURRENCY_B],
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0: feeValue0,
    feeValue1: feeValue1,
    outOfRange,
    error,
    parsedAmounts,
  }
}
export function useBurnProAmmActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useAppDispatch()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch],
  )

  return {
    onUserInput,
  }
}
