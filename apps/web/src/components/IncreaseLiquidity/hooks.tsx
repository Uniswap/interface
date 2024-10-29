// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { IncreaseLiquidityState } from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { DepositInfo } from 'components/Liquidity/types'
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

  const depositInfoProps = useMemo((): UseDepositInfoProps => {
    if (positionInfo.version === ProtocolVersion.V2) {
      return {
        protocolVersion: ProtocolVersion.V2,
        pair: positionInfo.pair,
        address: account.address,
        token0,
        token1,
        exactField,
        exactAmount,
      }
    }

    const { tickLower: tickLowerStr, tickUpper: tickUpperStr } = positionInfo
    const tickLower = tickLowerStr ? parseInt(tickLowerStr) : undefined
    const tickUpper = tickUpperStr ? parseInt(tickUpperStr) : undefined

    if (positionInfo.version === ProtocolVersion.V3) {
      return {
        protocolVersion: ProtocolVersion.V3,
        pool: positionInfo.pool,
        address: account.address,
        tickLower,
        tickUpper,
        token0,
        token1,
        exactField,
        exactAmount,
      }
    }

    if (positionInfo.version === ProtocolVersion.V4) {
      return {
        protocolVersion: ProtocolVersion.V4,
        pool: positionInfo.pool,
        address: account.address,
        tickLower,
        tickUpper,
        token0: currency0,
        token1: currency1,
        exactField,
        exactAmount,
      }
    }

    return {
      protocolVersion: ProtocolVersion.UNSPECIFIED,
      exactField,
    }
  }, [account.address, exactAmount, exactField, positionInfo, currency0, currency1, token0, token1])

  return useDepositInfo(depositInfoProps)
}
