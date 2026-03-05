import { type TransactionRequest } from '@ethersproject/abstract-provider'
import type { GasFeeResult } from '@universe/api'
import { useMemo } from 'react'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { GAS_SPEED_STRATEGIES, GasSpeed } from 'uniswap/src/features/gas/utils'

export function useTransactionGasFee(tx?: TransactionRequest, speed: GasSpeed = GasSpeed.Urgent): GasFeeResult {
  const gasStrategy = GAS_SPEED_STRATEGIES[speed]
  const { data, isLoading, error } = useGasFeeQuery({
    params: tx ? { tx, gasStrategy } : undefined,
  })

  return useMemo(
    () => ({
      value: data?.value,
      params: data?.params,
      isLoading,
      error,
    }),
    [data, isLoading, error],
  )
}
