import { JsonRpcProvider, TransactionReceipt } from '@ethersproject/providers'
import { useCallback, useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType } from 'uniswap/src/features/chains/types'
import { FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { useReceiptFailureHandler } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/receiptFetching/useReceiptFailureHandler'
import { useReceiptSuccessHandler } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/receiptFetching/useReceiptSuccessHandler'
import { useCurrentFlashblocksTransaction } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useCurrentFlashblocksTransaction'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

export function useFetchReceipt(): (
  fetcherIdAndStartTime: number,
  activeFetcherIdAndStartTime: React.MutableRefObject<number | undefined>,
) => Promise<void> {
  const accountAddress = useWallet().evmAccount?.address
  const chainId = useSwapDependenciesStore((s) => s.derivedSwapInfo.chainId)
  const transaction = useCurrentFlashblocksTransaction()

  const provider = useMemo(() => {
    const rpcUrl = getChainInfo(chainId).rpcUrls[RPCType.Public]?.http[0]
    if (!rpcUrl) {
      return undefined
    }
    return new JsonRpcProvider(rpcUrl)
  }, [chainId])

  const handleFailure = useReceiptFailureHandler()
  const handleSuccess = useReceiptSuccessHandler()

  const fetchReceipt = useCallback(
    async (
      fetcherIdAndStartTime: number,
      activeFetcherIdAndStartTime: React.MutableRefObject<number | undefined>,
    ): Promise<void> => {
      if (!provider || !transaction?.hash || !accountAddress) {
        throw new Error('Missing required dependencies for receipt fetch')
      }

      const startTime = Date.now()

      // Calculate if this transaction was completed within the flashblock threshold
      const isFlashblockTxWithinThreshold =
        ('options' in transaction ? transaction.options.rpcSubmissionTimestampMs || 0 : transaction.addedTime || 0) -
          startTime <=
        FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT

      try {
        // Get subblock receipt
        const receipt: TransactionReceipt | undefined = await provider.send('eth_getTransactionReceipt', [
          transaction.hash,
        ])

        // Check after async fetch in case another fetcher has taken over
        if (activeFetcherIdAndStartTime.current !== fetcherIdAndStartTime) {
          return
        }

        // Record the fetch time when we successfully get a receipt
        const methodFetchTime = Date.now()
        const methodRoundtripTime = methodFetchTime - startTime

        if (!receipt) {
          throw new Error('No receipt found')
        }

        await handleSuccess({
          receipt,
          transaction,
          methodFetchTime,
          methodRoundtripTime,
          isFlashblockTxWithinThreshold,
          provider,
        })
      } catch (error) {
        const retryFunction = (): Promise<void> =>
          fetchReceipt(fetcherIdAndStartTime, activeFetcherIdAndStartTime).catch(() => {
            // Ignore retry errors to prevent infinite recursion
          })

        handleFailure({
          error,
          fetcherIdAndStartTime,
          retryFunction,
        })
      }
    },
    [provider, transaction, accountAddress, handleFailure, handleSuccess],
  )

  return fetchReceipt
}
