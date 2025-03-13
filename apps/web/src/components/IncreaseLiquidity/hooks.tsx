import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  IncreaseLiquidityDerivedInfo,
  IncreaseLiquidityState,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useAccount } from 'hooks/useAccount'
import { UseDepositInfoProps, useDepositInfo } from 'pages/Pool/Positions/create/hooks'
import { getCurrencyWithOptionalUnwrap } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'

export function useDerivedIncreaseLiquidityInfo(
  state: IncreaseLiquidityState,
  unwrapNativeCurrency: boolean,
): IncreaseLiquidityDerivedInfo {
  const account = useAccount()
  const { position: positionInfo, exactAmount, exactField } = state

  if (!positionInfo) {
    throw new Error('no position available')
  }

  const currency0 = getCurrencyWithOptionalUnwrap({
    currency: positionInfo.currency0Amount.currency,
    shouldUnwrap: unwrapNativeCurrency && positionInfo.version !== ProtocolVersion.V4,
  })
  const currency1 = getCurrencyWithOptionalUnwrap({
    currency: positionInfo.currency1Amount.currency,
    shouldUnwrap: unwrapNativeCurrency && positionInfo.version !== ProtocolVersion.V4,
  })

  const depositInfoProps = useMemo((): UseDepositInfoProps => {
    if (positionInfo.version === ProtocolVersion.V2) {
      return {
        protocolVersion: ProtocolVersion.V2,
        pair: positionInfo.pair,
        address: account.address,
        token0: currency0,
        token1: currency1,
        exactField,
        exactAmounts: {
          [exactField]: exactAmount,
        },
        deposit0Disabled: false,
        deposit1Disabled: false,
      }
    }

    const { tickLower: tickLowerStr, tickUpper: tickUpperStr } = positionInfo
    const tickLower = tickLowerStr ? parseInt(tickLowerStr) : undefined
    const tickUpper = tickUpperStr ? parseInt(tickUpperStr) : undefined

    const deposit0Disabled = Boolean(tickUpper && positionInfo.pool && positionInfo.pool.tickCurrent >= tickUpper)
    const deposit1Disabled = Boolean(tickLower && positionInfo.pool && positionInfo.pool.tickCurrent <= tickLower)

    if (positionInfo.version === ProtocolVersion.V3) {
      return {
        protocolVersion: ProtocolVersion.V3,
        pool: positionInfo.pool,
        address: account.address,
        tickLower,
        tickUpper,
        token0: currency0,
        token1: currency1,
        exactField,
        exactAmounts: {
          [exactField]: exactAmount,
        },
        deposit0Disabled,
        deposit1Disabled,
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
        exactAmounts: {
          [exactField]: exactAmount,
        },
        deposit0Disabled,
        deposit1Disabled,
      }
    }

    return {
      protocolVersion: ProtocolVersion.UNSPECIFIED,
      exactField,
      exactAmounts: {},
    }
  }, [account.address, exactAmount, exactField, positionInfo, currency0, currency1])

  const depositInfo = useDepositInfo(depositInfoProps)

  return useMemo(
    () => ({
      ...depositInfo,
      deposit0Disabled: depositInfoProps.deposit0Disabled,
      deposit1Disabled: depositInfoProps.deposit1Disabled,
    }),
    [depositInfo, depositInfoProps.deposit0Disabled, depositInfoProps.deposit1Disabled],
  )
}
