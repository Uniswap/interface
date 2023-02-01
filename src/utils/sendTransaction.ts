import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { Transaction, VersionedTransaction } from '@solana/web3.js'
import { ethers } from 'ethers'

import connection from 'state/connection/connection'
import { SolanaEncode } from 'state/swap/types'
import { TRANSACTION_TYPE, TransactionHistory } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'

import { TransactionError } from './sentry'

export async function sendEVMTransaction(
  account: string,
  library: ethers.providers.Web3Provider | undefined,
  contractAddress: string,
  encodedData: string,
  value: BigNumber,
  handler?: (response: TransactionResponse) => void,
  chainId?: ChainId,
): Promise<TransactionResponse | undefined> {
  if (!account || !library) return

  const estimateGasOption = {
    from: account,
    to: contractAddress,
    data: encodedData,
    value,
  }

  let gasEstimate: ethers.BigNumber | undefined
  try {
    gasEstimate = await library.getSigner().estimateGas(estimateGasOption)
    if (!gasEstimate) throw new Error('gasEstimate is nullish value')
  } catch (error) {
    throw new TransactionError(error, estimateGasOption)
  }

  const sendTransactionOption = {
    from: account,
    to: contractAddress,
    data: encodedData,
    gasLimit: calculateGasMargin(gasEstimate, chainId),
    ...(value.eq('0') ? {} : { value }),
  }

  try {
    const response = await library.getSigner().sendTransaction(sendTransactionOption)
    handler?.(response)
    return response
  } catch (error) {
    throw new TransactionError(error, sendTransactionOption)
  }
}

const getInspectTxSolanaUrl = (tx: Transaction | VersionedTransaction | undefined | null) => {
  if (!tx) return ''
  if ('serializeMessage' in tx) return Buffer.concat([Buffer.from([0]), tx.serializeMessage()]).toString('base64')
  if ('serialize' in tx) return Buffer.from(tx.serialize()).toString('base64')
  return ''
}

export async function sendSolanaTransactions(
  encode: SolanaEncode,
  solanaWallet: SignerWalletAdapter,
  addTransactionWithType: (tx: TransactionHistory) => void,
  swapData: TransactionHistory,
): Promise<string[] | undefined> {
  if (!encode) return
  if (!encode.swapTx) return

  const txs: (Transaction | VersionedTransaction)[] = []

  if (encode.setupTx) {
    txs.push(encode.setupTx)
  }

  txs.push(encode.swapTx)

  const populateTx = (
    txs: (Transaction | VersionedTransaction)[],
  ): {
    signedSetupTx: Transaction | undefined
    signedSwapTx: VersionedTransaction
  } => {
    const result: {
      signedSetupTx: Transaction | undefined
      signedSwapTx: VersionedTransaction | undefined
    } = { signedSetupTx: undefined, signedSwapTx: undefined }
    let count = 0
    if (encode.setupTx) result.signedSetupTx = txs[count++] as Transaction
    result.signedSwapTx = txs[count++] as VersionedTransaction
    return result as {
      signedSetupTx: Transaction | undefined
      signedSwapTx: VersionedTransaction
    }
  }

  console.group('Sending transactions:')
  encode.setupTx && console.info('setup tx:', getInspectTxSolanaUrl(encode.setupTx))
  console.info('swap tx:', getInspectTxSolanaUrl(encode.swapTx))
  console.info('inspector: https://explorer.solana.com/tx/inspector')
  console.groupEnd()

  try {
    let signedTxs: (Transaction | VersionedTransaction)[]
    try {
      signedTxs = await (solanaWallet as SignerWalletAdapter).signAllTransactions(txs)
    } catch (e) {
      console.log({ e })
      throw e
    }
    const { signedSetupTx, signedSwapTx } = populateTx(signedTxs)
    const txHashs: string[] = []
    let setupHash: string
    if (signedSetupTx) {
      try {
        setupHash = await connection.sendRawTransaction(signedSetupTx.serialize())
        txHashs.push(setupHash)
        addTransactionWithType({
          type: TRANSACTION_TYPE.SETUP_SOLANA_SWAP,
          hash: setupHash,
          firstTxHash: txHashs[0],
          extraInfo: {
            arbitrary: {
              index: 1,
              total: signedTxs.length,
              mainTx: swapData,
            },
          },
        })
        await connection.confirmTransaction(setupHash, 'finalized')
      } catch (error) {
        console.error({ error })
        throw new Error('Set up error' + (error.message ? ': ' + error.message : ''))
      }
    }

    let swapHash: string
    try {
      swapHash = await connection.sendRawTransaction(Buffer.from(signedSwapTx.serialize()))
      txHashs.push(swapHash)
      addTransactionWithType({ ...swapData, hash: swapHash, firstTxHash: txHashs[0] })
    } catch (error) {
      console.error({ error })
      if (error?.message?.endsWith('0x1771')) {
        throw new Error(t`An error occurred. Try refreshing the price rate or increase max slippage`)
      } else if (/0x[0-9a-f]+$/.test(error.message)) {
        const errorCode = error.message.split(' ').slice(-1)[0]
        throw new Error(t`Error encountered. We haven’t send the transaction yet. Error code ${errorCode}`)
      }
      throw new Error(t`Error encountered. We haven’t send the transaction yet.`)
    }

    return txHashs
  } catch (e) {
    throw e
  }
}
