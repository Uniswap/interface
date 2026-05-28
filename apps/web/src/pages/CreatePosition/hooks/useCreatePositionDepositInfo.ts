import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { useMemo } from 'react'
import { useDepositInfo } from '~/features/Liquidity/Create/hooks/useDepositInfo'
import { isInvalidRange, isOutOfRange } from '~/features/Liquidity/utils/priceRangeInfo'
import { usePreEstimatedCreatePositionGas } from '~/pages/CreatePosition/hooks/usePreEstimatedCreatePositionGas'
import type { DepositInfo, DepositState } from '~/types/liquidity'
import { PositionField } from '~/types/position'

export type CreatePositionDepositInfoArgs = {
  evmAddress: string | undefined
  protocolVersion: ProtocolVersion
  currencies: { display: { [field in PositionField]: Maybe<Currency> } }
  ticks: [Maybe<number>, Maybe<number>]
  poolOrPair: V3Pool | V4Pool | Pair | undefined
  poolId: string | undefined
  depositState: DepositState
}

type CreatePositionDepositInfoResult = Pick<
  DepositInfo,
  'currencyMaxAmounts' | 'currencyAmounts' | 'formattedAmounts' | 'currencyAmountsUSDValue' | 'currencyBalances'
> & {
  inputError: DepositInfo['error']
  preEstimatedGasFee: string | undefined
  invalidRange: boolean
}

export function useCreatePositionDepositInfo({
  evmAddress,
  protocolVersion,
  currencies,
  ticks,
  poolOrPair,
  poolId,
  depositState,
}: CreatePositionDepositInfoArgs): CreatePositionDepositInfoResult {
  const { TOKEN0, TOKEN1 } = currencies.display
  const { exactField } = depositState

  const invalidRange = protocolVersion !== ProtocolVersion.V2 && isInvalidRange(ticks[0], ticks[1])

  const { gasFee: preEstimatedGasFee } = usePreEstimatedCreatePositionGas({
    protocolVersion,
    token0: TOKEN0,
    token1: TOKEN1,
    poolOrPair,
    poolId,
    ticks,
  })

  const depositInfoProps = useMemo(() => {
    const [tickLower, tickUpper] = ticks
    const outOfRange = isOutOfRange({
      poolOrPair,
      lowerTick: tickLower,
      upperTick: tickUpper,
    })

    return {
      protocolVersion,
      poolOrPair,
      address: evmAddress,
      token0: TOKEN0,
      token1: TOKEN1,
      tickLower: protocolVersion !== ProtocolVersion.V2 ? (tickLower ?? undefined) : undefined,
      tickUpper: protocolVersion !== ProtocolVersion.V2 ? (tickUpper ?? undefined) : undefined,
      exactField,
      exactAmounts: depositState.exactAmounts,
      skipDependentAmount: protocolVersion === ProtocolVersion.V2 ? false : outOfRange || invalidRange,
      actualGasFee: preEstimatedGasFee,
    }
  }, [
    TOKEN0,
    TOKEN1,
    exactField,
    ticks,
    poolOrPair,
    depositState,
    evmAddress,
    protocolVersion,
    invalidRange,
    preEstimatedGasFee,
  ])

  const {
    currencyMaxAmounts,
    currencyAmounts,
    error: inputError,
    formattedAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
  } = useDepositInfo(depositInfoProps)

  return {
    currencyMaxAmounts,
    currencyAmounts,
    inputError,
    formattedAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
    preEstimatedGasFee,
    invalidRange,
  }
}
