// eslint-disable-next-line no-restricted-imports
import { PoolPosition, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { IncreaseLiquidityState } from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { DepositInfo } from 'components/Liquidity/types'
import { getPairFromRest, getPoolFromRest } from 'components/Liquidity/utils'
import { useAccount } from 'hooks/useAccount'
import { UseDepositInfoProps, useDepositInfo } from 'pages/Pool/Positions/create/hooks'
import { useMemo } from 'react'

export function useDerivedIncreaseLiquidityInfo(state: IncreaseLiquidityState): DepositInfo {
  const account = useAccount()
  const { position: positionInfo, exactAmount, exactField } = state

  if (!positionInfo) {
    throw new Error('no position available')
  }

  const currency0 = positionInfo.currency0Amount.currency
  const token0 = currency0.isNative ? currency0.wrapped : currency0
  const currency1 = positionInfo.currency1Amount.currency
  const token1 = currency1.isNative ? currency1.wrapped : currency1

  const depositInfoProps: UseDepositInfoProps = useMemo(() => {
    if (positionInfo.restPosition.position.case === undefined) {
      return {
        protocolVersion: ProtocolVersion.UNSPECIFIED,
        exactField,
      }
    }

    if (positionInfo.restPosition.position.case === 'v2Pair') {
      const pair = getPairFromRest({
        pair: positionInfo.restPosition.position.value,
        token0,
        token1,
      })

      return {
        protocolVersion: ProtocolVersion.V2,
        pair,
        address: account.address,
        token0: currency0,
        token1: currency1,
        exactField,
        exactAmount,
      }
    }

    if (positionInfo.restPosition.position.case === 'v3Position') {
      const position: PoolPosition = positionInfo.restPosition.position.value
      const { tickLower: tickLowerStr, tickUpper: tickUpperStr } = position
      const tickLower = parseInt(tickLowerStr)
      const tickUpper = parseInt(tickUpperStr)

      const pool = getPoolFromRest({ pool: position, token0, token1 })

      return {
        protocolVersion: ProtocolVersion.V3,
        pool: pool ?? undefined,
        address: account.address,
        tickLower,
        tickUpper,
        token0,
        token1,
        exactField,
        exactAmount,
      }
    }

    // TODO: handle v4 case
    return {
      protocolVersion: ProtocolVersion.UNSPECIFIED,
      exactField,
    }
  }, [
    account.address,
    exactAmount,
    exactField,
    positionInfo.restPosition.position.case,
    positionInfo.restPosition.position.value,
    currency0,
    currency1,
    token0,
    token1,
  ])

  return useDepositInfo(depositInfoProps)
}
