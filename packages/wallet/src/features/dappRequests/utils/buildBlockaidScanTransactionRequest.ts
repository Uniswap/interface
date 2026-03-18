import { type BlockaidScanTransactionRequest } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EthTransaction } from 'uniswap/src/types/walletConnect'

interface TransactionRequestData {
  chainId: UniverseChainId
  account: string
  transaction: EthTransaction
  dappUrl: string
}

/**
 * Builds a Blockaid scan request from transaction request data
 * @param request Transaction request data from WalletConnect or dapp request
 * @returns Blockaid scan transaction request
 */
export function buildBlockaidScanTransactionRequest(request: TransactionRequestData): BlockaidScanTransactionRequest {
  const { transaction, chainId, account, dappUrl } = request

  return {
    chain: chainId.toString(),
    account_address: account,
    metadata: {
      domain: dappUrl,
    },
    data: {
      from: transaction.from || account,
      to: transaction.to,
      value: transaction.value,
      data: transaction.data,
      gas: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
    },
    options: ['validation', 'simulation'],
  }
}
