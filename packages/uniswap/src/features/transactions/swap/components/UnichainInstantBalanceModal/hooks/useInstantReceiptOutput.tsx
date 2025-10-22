import { JsonRpcProvider } from '@ethersproject/providers'
import { useEffect, useMemo, useRef } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType } from 'uniswap/src/features/chains/types'
import { useFetchReceipt } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/receiptFetching/useFetchReceipt'
import { useCurrentFlashblocksTransaction } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useCurrentFlashblocksTransaction'
import { shouldShowFlashblocksUI } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { logger } from 'utilities/src/logger/logger'

/**
 * Polls for the flashblock-aware transaction receipt and extracts the output amount.
 * Sets instantOutputCurrencyId and instantOutputAmountRaw on the swap form store once found,
 * then navigates to the Instant Balance modal.
 */
export function useInstantReceiptOutput(): void {
  const derivedSwapInfo = useSwapDependenciesStore((s) => s.derivedSwapInfo)
  const chainId = derivedSwapInfo.chainId
  const outputCurrencyInfo = derivedSwapInfo.currencies.output
  const isFlashblocksModalRoute = shouldShowFlashblocksUI(derivedSwapInfo.trade.trade?.routing)

  const { isConfirmed, instantReceiptFetchTime } = useSwapFormStore((s) => ({
    isConfirmed: s.isConfirmed,
    instantReceiptFetchTime: s.instantReceiptFetchTime,
  }))

  const accountAddress = useWallet().evmAccount?.address
  const transaction = useCurrentFlashblocksTransaction()
  const txHash = transaction?.hash

  const provider = useMemo(() => {
    const rpcUrl = getChainInfo(chainId).rpcUrls[RPCType.Public]?.http[0]
    if (!rpcUrl) {
      return undefined
    }
    return new JsonRpcProvider(rpcUrl)
  }, [chainId])

  const fetchReceipt = useFetchReceipt()

  const activeFetcherIdAndStartTime = useRef<number | undefined>(undefined)
  // biome-ignore lint/correctness/useExhaustiveDependencies: +transaction?.hash
  useEffect(() => {
    activeFetcherIdAndStartTime.current = undefined
  }, [transaction?.hash])

  useEffect(() => {
    if (
      !isConfirmed ||
      !outputCurrencyInfo ||
      !txHash ||
      !provider ||
      !accountAddress ||
      activeFetcherIdAndStartTime.current ||
      !isFlashblocksModalRoute ||
      // don't attempt to fetch if already fetched
      instantReceiptFetchTime
    ) {
      return
    }

    const fetcherIdAndStartTime = Date.now()
    activeFetcherIdAndStartTime.current = fetcherIdAndStartTime

    fetchReceipt(fetcherIdAndStartTime, activeFetcherIdAndStartTime).catch((error) => {
      logger.error(error, {
        tags: { file: 'useInstantReceiptOutput', function: 'fetchReceipt' },
      })
    })
  }, [
    isConfirmed,
    instantReceiptFetchTime,
    txHash,
    provider,
    outputCurrencyInfo,
    accountAddress,
    isFlashblocksModalRoute,
    fetchReceipt,
  ])
}
