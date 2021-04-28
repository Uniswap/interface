import { TokenAmount, Percent } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { usePool } from 'hooks/usePools'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PositionDetails } from 'types/position'

import { AppDispatch, AppState } from '../../index'
import { selectPercent } from './actions'

export function useBurnV3State(): AppState['burnV3'] {
  return useSelector<AppState, AppState['burnV3']>((state) => state.burnV3)
}

export function useDerivedV3BurnInfo(
  position?: PositionDetails
): {
  position?: Position
  liquidityPercentage?: Percent
  liquidityValue0?: TokenAmount
  liquidityValue1?: TokenAmount
  feeValue0?: TokenAmount
  feeValue1?: TokenAmount
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

  const liquidityValue0 =
    positionSDK &&
    new TokenAmount(positionSDK.amount0.token, liquidityPercentage.multiply(positionSDK.amount0.raw).quotient)
  const liquidityValue1 =
    positionSDK &&
    new TokenAmount(positionSDK.amount1.token, liquidityPercentage.multiply(positionSDK.amount1.raw).quotient)

  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, position)

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
