import { JsonRpcProvider } from '@ethersproject/providers'
import { ExplorerAbiFetcher, Parser, ProxyAbiFetcher, Transaction, TransactionDescription } from 'no-yolo-signatures'
import { useEffect, useMemo, useState } from 'react'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { RPCType, UniverseChainId } from 'uniswap/src/types/chains'
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

    const rpcUrls = UNIVERSE_CHAIN_INFO[chainId].rpcUrls
    const apiURL = UNIVERSE_CHAIN_INFO[chainId].explorer.apiURL || ''

    const explorerAbiFetcher = new ExplorerAbiFetcher(apiURL)

    // TODO: revisit this once quicknode RPCs are added and then prioritize rpcUrls?.appOnly?.http[0]
    const rpcUrl =
      rpcUrls?.default?.http[0] || rpcUrls?.[RPCType.Public]?.http[0] || rpcUrls?.[RPCType.PublicAlt]?.http[0]
    const provider = new JsonRpcProvider(rpcUrl)

    const proxyAbiFetcher = new ProxyAbiFetcher(provider, [explorerAbiFetcher])

    return new Parser({ abiFetchers: [proxyAbiFetcher, explorerAbiFetcher] })
  }, [chainId])

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
