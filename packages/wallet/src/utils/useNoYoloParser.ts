import { JsonRpcProvider } from '@ethersproject/providers'
import { ExplorerAbiFetcher, Parser, ProxyAbiFetcher, Transaction, TransactionDescription } from 'no-yolo-signatures'
import { useEffect, useMemo, useState } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'

export function useNoYoloParser(
  transaction: EthTransaction,
  chainId?: UniverseChainId,
): { parsedTransactionData: TransactionDescription | undefined; isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(true)
  const [parsedTransactionData, setParsedTransactionData] = useState<TransactionDescription | undefined>(undefined)
  const { from, to, value, data } = transaction

  const parser = useMemo(() => {
    if (!chainId) {
      return new Parser({ abiFetchers: [] })
    }

    const rpcUrls = getChainInfo(chainId).rpcUrls
    const apiURL = getChainInfo(chainId).explorer.apiURL || ''

    const explorerAbiFetcher = new ExplorerAbiFetcher(apiURL)

    const rpcUrl = rpcUrls.default.http[0] || rpcUrls[RPCType.Public]?.http[0] || rpcUrls[RPCType.PublicAlt]?.http[0]
    const provider = new JsonRpcProvider(rpcUrl, chainId)

    const proxyAbiFetcher = new ProxyAbiFetcher(provider, [explorerAbiFetcher])

    return new Parser({ abiFetchers: [proxyAbiFetcher, explorerAbiFetcher] })
  }, [chainId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +value
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
