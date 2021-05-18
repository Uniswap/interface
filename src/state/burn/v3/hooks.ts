import { Token, CurrencyAmount, Percent, Ether, currencyEquals, ETHER } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { usePool } from 'hooks/usePools'
import { useActiveWeb3React } from 'hooks/web3'
import { useToken } from 'hooks/Tokens'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PositionDetails } from 'types/position'

import { AppDispatch, AppState } from '../../index'
import { selectPercent } from './actions'
import { unwrappedToken } from 'utils/wrappedCurrency'

export function useBurnV3State(): AppState['burnV3'] {
  return useSelector<AppState, AppState['burnV3']>((state) => state.burnV3)
}

export function useDerivedV3BurnInfo(
  position?: PositionDetails,
  asWETH = false
): {
  position?: Position
  liquidityPercentage?: Percent
  liquidityValue0?: CurrencyAmount<Token | Ether>
  liquidityValue1?: CurrencyAmount<Token | Ether>
  feeValue0?: CurrencyAmount<Token | Ether>
  feeValue1?: CurrencyAmount<Token | Ether>
  outOfRange: boolean
  error?: string
} {
  const { account } = useActiveWeb3React()
  const { percent } = useBurnV3State()

  const token0 = useToken(position?.token0)
  const token1 = useToken(position?.token1)

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
    [pool, position]
  )

  const liquidityPercentage = new Percent(percent, 100)

  const discountedAmount0 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount0.quotient).quotient
    : undefined
  const discountedAmount1 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount1.quotient).quotient
    : undefined

  const liquidityValue0 =
    token0 && discountedAmount0
      ? currencyEquals(unwrappedToken(token0), ETHER) && !asWETH
        ? CurrencyAmount.ether(discountedAmount0)
        : CurrencyAmount.fromRawAmount(token0, discountedAmount0)
      : undefined
  const liquidityValue1 =
    token1 && discountedAmount1
      ? currencyEquals(unwrappedToken(token1), ETHER) && !asWETH
        ? CurrencyAmount.ether(discountedAmount1)
        : CurrencyAmount.fromRawAmount(token1, discountedAmount1)
      : undefined

  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, position?.tokenId, asWETH)

  const outOfRange =
    pool && position ? pool.tickCurrent < position.tickLower || pool.tickCurrent > position.tickUpper : false

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (percent === 0) {
    error = error ?? 'Enter a percent'
  }
  return {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0,
    feeValue1,
    outOfRange,
    error,
  }
}

export function useBurnV3ActionHandlers(): {
  onPercentSelect: (percent: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onPercentSelect = useCallback(
    (percent: number) => {
      dispatch(selectPercent({ percent }))
    },
    [dispatch]
  )

  return {
    onPercentSelect,
  }
}
