import { providers } from 'ethers'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useRestQuery } from 'uniswap/src/data/rest'
import { PollingInterval } from 'wallet/src/constants/misc'
import { getPollingIntervalByBlocktime } from 'wallet/src/features/chains/utils'
import { GasFeeResponse } from 'wallet/src/features/gas/types'

export function useGasFeeQuery(
  tx: Maybe<providers.TransactionRequest>,
  skip?: boolean,
  pollingInterval?: PollingInterval
): ReturnType<typeof useRestQuery<GasFeeResponse>> {
  return useRestQuery<GasFeeResponse, providers.TransactionRequest>(
    uniswapUrls.gasServicePath,
    // type cast only necessary for typing. `skip` check below will skip query
    // if `tx` is undefined.
    tx as providers.TransactionRequest,
    ['type', 'gasLimit', 'gasLimit', 'gasFee', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'],
    {
      pollInterval: pollingInterval ?? getPollingIntervalByBlocktime(tx?.chainId),
      skip: skip || !tx,
      ttlMs: pollingInterval ?? getPollingIntervalByBlocktime(tx?.chainId),
    }
  )
}
