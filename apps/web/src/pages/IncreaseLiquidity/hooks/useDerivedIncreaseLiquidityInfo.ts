import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useDepositInfo, UseDepositInfoProps } from 'components/Liquidity/Create/hooks/useDepositInfo'
import { getCurrencyWithOptionalUnwrap } from 'components/Liquidity/utils/currency'
import { useAccount } from 'hooks/useAccount'
import { IncreaseLiquidityDerivedInfo, IncreaseLiquidityState } from 'pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { useMemo } from 'react'
import { PositionField } from 'types/position'

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
      }
    }

    const { tickLower, tickUpper } = positionInfo

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
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
      }
    }

    return {
      protocolVersion: ProtocolVersion.UNSPECIFIED,
      exactField,
      exactAmounts: {},
    }
  }, [account.address, exactAmount, exactField, positionInfo, currency0, currency1])

  const depositInfo = useDepositInfo(depositInfoProps)

  return {
    ...depositInfo,
    currencies: {
      [PositionField.TOKEN0]: currency0,
      [PositionField.TOKEN1]: currency1,
    },
  }
}
