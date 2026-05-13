import { ExplorerAbiFetcher, Parser, ProxyAbiFetcher, Transaction, TransactionDescription } from 'no-yolo-signatures'
import { useEffect, useMemo, useState } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'
import { useProviderManager } from 'wallet/src/features/wallet/context'

export function useNoYoloParser(
  transaction: EthTransaction,
  chainId?: UniverseChainId,
): { parsedTransactionData: TransactionDescription | undefined; isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(true)
  const [parsedTransactionData, setParsedTransactionData] = useState<TransactionDescription | undefined>(undefined)
  const { from, to, value, data } = transaction
  const providerManager = useProviderManager()

  const parser = useMemo(() => {
    if (!chainId) {
      return new Parser({ abiFetchers: [] })
    }

    const apiURL = getChainInfo(chainId).explorer.apiURL || ''
    const explorerAbiFetcher = new ExplorerAbiFetcher(apiURL)

    // Route the proxy ABI lookup through the wallet's ProviderManager so it
    // shares UniRPC + observability with the rest of the app. Constructing a
    // bare JsonRpcProvider here would bypass the entry gateway and emit no
    // telemetry. If provider construction fails (no public RPC for this chain),
    // fall back to the explorer-only fetcher rather than throwing.
    const abiFetchers = []
    try {
      const provider = providerManager.getProvider(chainId)
      abiFetchers.push(new ProxyAbiFetcher(provider, [explorerAbiFetcher]))
    } catch (error) {
      logger.warn('useNoYoloParser', 'parser', 'Provider unavailable, falling back to explorer-only ABI fetch', {
        chainId,
        error,
      })
    }
    abiFetchers.push(explorerAbiFetcher)

    return new Parser({ abiFetchers })
  }, [chainId, providerManager])

  useEffect(() => {
    const parseResult = async (): Promise<TransactionDescription | undefined> => {
      // no-yolo-parser library expects these fields to be defined
      if (!from || !to || !data) {
        return undefined
      }
      return parser.parseAsResult(transaction as Transaction).then((result) => {
        if (!result.transactionDescription.ok) {
          throw result.transactionDescription.error
        }

        return result.transactionDescription.result
      })
    }

    parseResult()
      .then(setParsedTransactionData)
      .catch((error) => {
        setParsedTransactionData(undefined)
        logger.warn('RequestMessage', 'DecodedDataDetails', 'Could not parse data', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [data, from, parser, to, transaction, value])

  return { parsedTransactionData, isLoading }
}
