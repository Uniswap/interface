import { VersionedTransaction } from '@solana/web3.js'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { signSolanaTransactionWithCurrentWallet } from 'components/Web3Provider/signSolanaTransaction'
import store from 'state'
import { getSwapTransactionInfo } from 'state/sagas/transactions/utils'
import { call } from 'typed-redux-saga'
import { execute } from 'uniswap/src/data/apiClients/jupiterApi/execute/request'
import { JupiterExecuteResponse } from 'uniswap/src/data/apiClients/jupiterApi/execute/types'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { JupiterExecuteError } from 'uniswap/src/features/transactions/errors'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import { ValidatedSolanaSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { tryCatch } from 'utilities/src/errors'

type JupiterSwapParams = {
  account: SignerMnemonicAccountDetails
  analytics: SwapTradeBaseProperties
  swapTxContext: ValidatedSolanaSwapTxAndGasInfo
}

async function signAndSendJupiterSwap({
  transaction,
  requestId,
  signSolanaTransaction,
}: {
  transaction: VersionedTransaction
  requestId: string
  signSolanaTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>
}): Promise<JupiterExecuteResponse> {
  const signedTransactionObj = await signSolanaTransaction(transaction)
  const signedTransaction = Buffer.from(signedTransactionObj.serialize()).toString('base64')
  const result = await execute({ signedTransaction, requestId })

  return result
}

function updateAppState({ hash, trade, from }: { hash: string; trade: SolanaTrade; from: string }) {
  const typeInfo = getSwapTransactionInfo(trade)

  store.dispatch(
    addTransaction({
      from,
      typeInfo,
      hash,
      chainId: UniverseChainId.Solana,
      routing: Routing.JUPITER,
      status: TransactionStatus.Success,
      addedTime: Date.now(),
      id: hash,
      transactionOriginType: TransactionOriginType.Internal,
      options: {
        request: {},
      },
    }),
  )

  popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)
}

function createJupiterSwap(signSolanaTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>) {
  return function* jupiterSwap(params: JupiterSwapParams) {
    const { swapTxContext, account } = params
    const { trade, transactionBase64 } = swapTxContext
    const { requestId } = trade.quote.quote

    const transaction = VersionedTransaction.deserialize(Buffer.from(transactionBase64, 'base64'))

    const { data, error } = yield* call(() =>
      tryCatch(signAndSendJupiterSwap({ transaction, requestId, signSolanaTransaction })),
    )

    if (error) {
      throw error
    }
    const { signature: hash, status, code, error: errorMessage } = data
    if (status !== 'Success' || !hash) {
      throw new JupiterExecuteError(errorMessage ?? 'Unknown Jupiter Execution Error', code)
    }

    updateAppState({ hash, trade, from: account.address })

    return
  }
}

export const jupiterSwap = createJupiterSwap(signSolanaTransactionWithCurrentWallet)
