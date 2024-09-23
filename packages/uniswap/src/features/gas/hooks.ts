import { providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { FeeType, GasFeeResult, GasSpeed } from 'uniswap/src/features/gas/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export type CancelationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  cancelationGasFee: string
}

export function useTransactionGasFee(
  tx: providers.TransactionRequest | undefined,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean,
  refetchInterval?: PollingInterval,
): GasFeeResult {
  const pollingIntervalForChain = usePollingIntervalByChain(tx?.chainId)

  const { data, error, isLoading } = useGasFeeQuery({
    params: skip ? undefined : tx,
    refetchInterval,
    staleTime: pollingIntervalForChain,
    immediateGcTime: pollingIntervalForChain + 15 * ONE_SECOND_MS,
  })

  return useMemo(() => {
    if (!data) {
      return { error: error ?? null, isLoading }
    }

    const params =
      data.type === FeeType.Eip1559
        ? {
            maxPriorityFeePerGas: data.maxPriorityFeePerGas[speed],
            maxFeePerGas: data.maxFeePerGas[speed],
            gasLimit: data.gasLimit,
          }
        : {
            gasPrice: data.gasPrice[speed],
            gasLimit: data.gasLimit,
          }
    return {
      value: data.gasFee[speed],
      isLoading,
      error: error ?? null,
      params,
    }
  }, [data, error, isLoading, speed])
}

export function useUSDValue(chainId?: UniverseChainId, ethValueInWei?: string): string | undefined {
  const currencyAmount = getCurrencyAmount({
    value: ethValueInWei,
    valueType: ValueType.Raw,
    currency: chainId ? NativeCurrency.onChain(chainId) : undefined,
  })

  return useUSDCValue(currencyAmount)?.toExact()
}
