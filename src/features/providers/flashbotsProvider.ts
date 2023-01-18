import { providers as ethersProviders } from 'ethers'
import { ChainId } from 'src/constants/chains'
import { FLASHBOTS_URLS } from 'src/features/providers/constants'
import { TransactionStatus } from 'src/features/transactions/types'

export const FLASHBOTS_SUPPORTED_CHAINS = Object.keys(FLASHBOTS_URLS)
export const isFlashbotsSupportedChainId = (chainId?: ChainId): boolean =>
  FLASHBOTS_SUPPORTED_CHAINS.includes(chainId?.toString() || '')

type FlashbotsTxStatus = 'PENDING' | 'INCLUDED' | 'FAILED' | 'CANCELLLED' | 'UNKNOWN'
type FlashbotsTxStatusResult = {
  status: FlashbotsTxStatus
  hash: string
  maxBlockNumber: number
  transaction: ethersProviders.TransactionRequest
}

export const fetchTransactionStatus = async (
  txHash: string,
  chainId: ChainId
): Promise<
  | TransactionStatus.Cancelled
  | TransactionStatus.Success
  | TransactionStatus.Failed
  | TransactionStatus.Pending
  | TransactionStatus.Unknown
> => {
  const baseUrl = FLASHBOTS_URLS[chainId]?.txApi
  const response = await fetch(`${baseUrl}/${txHash}`)
  const result: FlashbotsTxStatusResult = await response.json()

  switch (result.status) {
    case 'PENDING':
      return TransactionStatus.Pending
    case 'INCLUDED':
      return TransactionStatus.Success
    case 'UNKNOWN':
      return TransactionStatus.Unknown
    case 'FAILED':
      return TransactionStatus.Failed
    case 'CANCELLLED':
      return TransactionStatus.Cancelled
  }
}
