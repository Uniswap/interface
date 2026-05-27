import { type TransactionRequest } from '@ethersproject/abstract-provider'
import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import type { GasFeeResult } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { GAS_SPEED_STRATEGIES, GasSpeed } from 'uniswap/src/features/gas/utils'

const SPEED_TO_PROTO_LEVEL: Record<GasSpeed, Level> = {
  [GasSpeed.Normal]: Level.NORMAL,
  [GasSpeed.Fast]: Level.FAST,
  [GasSpeed.Urgent]: Level.URGENT,
}

export function useTransactionGasFee(tx?: TransactionRequest, speed: GasSpeed = GasSpeed.Urgent): GasFeeResult {
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)

  const gasStrategy = GAS_SPEED_STRATEGIES[speed]
  const urgency = useMemo(() => ({ level: SPEED_TO_PROTO_LEVEL[speed] }), [speed])

  const { data, isLoading, error } = useGasFeeQuery({
    params: tx
      ? {
          tx,
          // `gasStrategy` is always sent. `urgency` is sent only when the
          // override flag is on; when both are present, the gas service uses
          // `urgency`.
          gasStrategy,
          ...(isGasFeeOverridesEnabled ? { urgency } : {}),
        }
      : undefined,
  })

  return useMemo(() => ({ value: data?.value, params: data?.params, isLoading, error }), [data, isLoading, error])
}
