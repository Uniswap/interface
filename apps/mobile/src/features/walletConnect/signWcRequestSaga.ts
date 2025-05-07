import { providers } from 'ethers'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  TransactionRequest,
  UwuLinkErc20Request,
  WalletSendCallsEncodedRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { call, put } from 'typed-redux-saga'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod, EthSignMethod } from 'uniswap/src/features/dappRequests/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { TransactionOriginType, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DappInfo, UwULinkMethod, WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { addBatchedTransaction } from 'wallet/src/features/batchedTransactions/slice'
import { SendCallsResult } from 'wallet/src/features/dappRequests/types'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getSignerManager } from 'wallet/src/features/wallet/context'
import { signMessage, signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'

type SignMessageParams = {
  sessionId: string
  requestInternalId: string
  message: string
  account: Account
  method: EthSignMethod
  dapp: DappInfo
  chainId: UniverseChainId
}

type SignTransactionParams = {
  sessionId: string
  requestInternalId: string
  transaction: providers.TransactionRequest
  account: Account
  method: EthMethod.EthSendTransaction | EthMethod.WalletSendCalls
  dapp: DappInfo
  chainId: UniverseChainId
  request: TransactionRequest | UwuLinkErc20Request | WalletSendCallsEncodedRequest
}

function* signWcRequest(params: SignMessageParams | SignTransactionParams) {
  const { sessionId, requestInternalId, account, method, chainId } = params
  const { defaultChainId } = yield* getEnabledChainIdsSaga()
  try {
    const signerManager = yield* call(getSignerManager)
    let result: string | SendCallsResult = ''
    if (method === EthMethod.PersonalSign || method === EthMethod.EthSign) {
      result = yield* call(signMessage, params.message, account, signerManager)

      // TODO: add `isCheckIn` type to uwulink request info so that this can be generalized
      if (params.dapp.source === 'uwulink' && params.dapp.name === 'Uniswap Cafe') {
        yield* put(
          pushNotification({
            type: AppNotificationType.Success,
            title: 'Checked in',
          }),
        )
      }
    } else if (method === EthMethod.SignTypedData || method === EthMethod.SignTypedDataV4) {
      result = yield* call(signTypedDataMessage, params.message, account, signerManager)
    } else if (method === EthMethod.EthSendTransaction && params.request.type === UwULinkMethod.Erc20Send) {
      const txParams: ExecuteTransactionParams = {
        chainId: params.transaction.chainId || defaultChainId,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.Send,
          assetType: AssetType.Currency,
          recipient: params.request.recipient.address,
          tokenAddress: params.request.tokenAddress,
          currencyAmountRaw: params.request.amount,
        },
        transactionOriginType: TransactionOriginType.External,
      }
      const { transactionResponse } = yield* call(executeTransaction, txParams)
      result = transactionResponse.hash
    } else if (method === EthMethod.EthSendTransaction) {
      const txParams: ExecuteTransactionParams = {
        chainId: params.transaction.chainId || defaultChainId,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.WCConfirm,
          dapp: params.dapp,
        },
        transactionOriginType: TransactionOriginType.External,
      }
      const { transactionResponse } = yield* call(executeTransaction, txParams)
      result = transactionResponse.hash

      // Trigger a pending transaction notification after we send the transaction to chain
      yield* put(
        pushNotification({
          type: AppNotificationType.TransactionPending,
          chainId: txParams.chainId,
        }),
      )
    } else if (method === EthMethod.WalletSendCalls && params.request.type === EthMethod.WalletSendCalls) {
      const txParams: ExecuteTransactionParams = {
        chainId: params.request.chainId,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.WCConfirm,
          dapp: params.dapp,
        },
        transactionOriginType: TransactionOriginType.External,
      }

      const { transactionResponse } = yield* call(executeTransaction, txParams)
      result = { id: params.request.id, capabilities: {} }

      // Store the batch transaction in Redux
      yield* put(
        addBatchedTransaction({
          batchId: params.request.id,
          txHashes: [transactionResponse.hash],
          requestId: params.request.encodedRequestId,
          chainId: params.request.chainId,
        }),
      )

      // Trigger a pending transaction notification after we send the transaction to chain
      yield* put(
        pushNotification({
          type: AppNotificationType.TransactionPending,
          chainId: txParams.chainId,
        }),
      )
    }

    if (params.dapp.source === 'walletconnect') {
      yield* call(wcWeb3Wallet.respondSessionRequest, {
        topic: sessionId,
        response: {
          id: Number(requestInternalId),
          jsonrpc: '2.0',
          result,
        },
      })
    } else if (params.dapp.source === 'uwulink' && params.dapp.webhook) {
      fetch(params.dapp.webhook, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method: params.method, response: result, chainId }),
        // TODO: consider adding analytics to track UwuLink usage
      }).catch((error) =>
        logger.error(error, {
          tags: { file: 'walletConnect/saga', function: 'signWcRequest/uwulink' },
        }),
      )
    }
  } catch (error) {
    if (params.dapp.source === 'walletconnect') {
      yield* call(wcWeb3Wallet.respondSessionRequest, {
        topic: sessionId,
        response: {
          id: Number(requestInternalId),
          jsonrpc: '2.0',
          error: { code: 5000, message: `Signing error: ${error}` },
        },
      })
    }

    yield* put(
      pushNotification({
        type: AppNotificationType.WalletConnect,
        event: WalletConnectEvent.TransactionFailed,
        dappName: params.dapp.name,
        imageUrl: params.dapp.icon ?? null,
        chainId,
        address: account.address,
      }),
    )
    logger.error(error, { tags: { file: 'walletConnect/saga', function: 'signWcRequest' } })
  }
}

export const { wrappedSaga: signWcRequestSaga, actions: signWcRequestActions } = createSaga(
  signWcRequest,
  'signWalletConnect',
)
