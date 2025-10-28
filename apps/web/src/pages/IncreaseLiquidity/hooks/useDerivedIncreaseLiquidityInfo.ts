import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useDepositInfo } from 'components/Liquidity/Create/hooks/useDepositInfo'
import { getCurrencyWithOptionalUnwrap } from 'components/Liquidity/utils/currency'
import { useAccount } from 'hooks/useAccount'
import { IncreaseLiquidityDerivedInfo, IncreaseLiquidityState } from 'pages/IncreaseLiquidity/IncreaseLiquidityContext'
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

  const { tickLower, tickUpper } = positionInfo

  const depositInfo = useDepositInfo({
    protocolVersion: positionInfo.version,
    poolOrPair: positionInfo.poolOrPair,
    address: account.address,
    token0: currency0,
    token1: currency1,
    tickLower,
    tickUpper,
    exactField,
    exactAmounts: {
      [exactField]: exactAmount,
    },
  })

  return {
    ...depositInfo,
    currencies: {
      [PositionField.TOKEN0]: currency0,
      [PositionField.TOKEN1]: currency1,
    },
  }
}
