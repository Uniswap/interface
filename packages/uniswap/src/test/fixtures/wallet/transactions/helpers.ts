import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { formatEther } from '@ethersproject/units'
import { BigNumber, providers } from 'ethers/lib/ethers'
import merge from 'lodash/merge'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import {
  ClassicTransactionDetails,
  TransactionReceipt,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  ethersTransactionReceipt,
  ethersTransactionRequest,
  ethersTransactionResponse,
} from 'uniswap/src/test/fixtures/lib/ethers'
import {
  finalizedTransactionAction,
  finalizedTransactionDetails,
  transactionDetails,
  transactionReceipt,
} from 'uniswap/src/test/fixtures/wallet/transactions/fixtures'
import { faker } from 'uniswap/src/test/shared'

type TxFixtures<T extends ClassicTransactionDetails> = {
  txDetailsPending: T
  txDetailsSuccess: T
  txDetailsFailed: T
  txRequest: TransactionRequest
  txResponse: TransactionResponse
  txTypeInfo: T['typeInfo']
  txReceipt: TransactionReceipt
  ethersTxReceipt: providers.TransactionReceipt
  finalizedTxAction: ReturnType<typeof finalizeTransaction>
}

export const getTxFixtures = <T extends ClassicTransactionDetails>(
  transaction?: T,
): TxFixtures<T & { hash: string }> => {
  const txBase = merge(
    {},
    transactionDetails({
      hash: faker.datatype.uuid(),
      options: {
        request: ethersTransactionRequest(),
        userSubmissionTimestampMs: Date.now(),
        rpcSubmissionTimestampMs: Date.now(),
      },
    }),
    transaction,
  )

  // Transaction flow
  // 1. Generate the pending version of the transaction
  const txDetailsPending = transactionDetails({ ...txBase, status: TransactionStatus.Pending })

  // 2. Generate the transaction receipt and response
  const txReceipt = transactionReceipt()
  const ethersTxReceipt = ethersTransactionReceipt({
    from: txDetailsPending.from,
    to: txDetailsPending.options.request.to,
    transactionHash: txDetailsPending.hash,
    blockNumber: txReceipt.blockNumber,
    confirmations: txReceipt.confirmations,
    transactionIndex: txReceipt.transactionIndex,
    gasUsed: BigNumber.from(txReceipt.gasUsed),
    blockHash: txReceipt.blockHash,
    cumulativeGasUsed: BigNumber.from(txReceipt.gasUsed),
    effectiveGasPrice: BigNumber.from(txReceipt.effectiveGasPrice),
    status: 1, // Must be non-zero for successful finalized transaction status
  })

  const txResponse = ethersTransactionResponse({
    hash: txDetailsPending.hash,
    confirmations: txReceipt.confirmations,
    from: txDetailsPending.from,
    wait: () => Promise.resolve(ethersTxReceipt),
  })

  const { nativeCurrency } = getChainInfo(txDetailsPending.chainId)

  // 3. Create successful/failed transaction
  const txDetailsSuccess = finalizedTransactionDetails({
    ...txDetailsPending,
    status: TransactionStatus.Success,
    receipt: txReceipt,
    networkFee: {
      quantity: formatEther(ethersTxReceipt.effectiveGasPrice.mul(ethersTxReceipt.gasUsed)),
      tokenSymbol: nativeCurrency.symbol,
      tokenAddress: nativeCurrency.address,
      chainId: txDetailsPending.chainId,
    },
  })
  const txDetailsFailed = finalizedTransactionDetails({
    ...txDetailsPending,
    status: TransactionStatus.Failed,
  })
  // 4. Generate finalized transaction action
  const finalizedTxAction = finalizedTransactionAction({
    payload: txDetailsSuccess,
  })

  return {
    txDetailsPending,
    txDetailsSuccess,
    ethersTxReceipt,
    txDetailsFailed,
    finalizedTxAction,
    txReceipt,
    txRequest: txBase.options.request,
    txResponse,
    txTypeInfo: txBase.typeInfo,
  }
}
