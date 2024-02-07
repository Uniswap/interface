import { providers } from 'ethers'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { call, put } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  SendTransactionParams,
  sendTransaction,
} from 'wallet/src/features/transactions/sendTransactionSaga'
import { TransactionType } from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getSignerManager } from 'wallet/src/features/wallet/context'
import { signMessage, signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'
import {
  DappInfo,
  EthMethod,
  EthSignMethod,
  WalletConnectEvent,
} from 'wallet/src/features/walletConnect/types'
import { createSaga } from 'wallet/src/utils/saga'

type SignMessageParams = {
  sessionId: string
  requestInternalId: string
  message: string
  account: Account
  method: EthSignMethod
  dapp: DappInfo
  chainId: ChainId
}

type SignTransactionParams = {
  sessionId: string
  requestInternalId: string
  transaction: providers.TransactionRequest
  account: Account
  method: EthMethod.EthSendTransaction
  dapp: DappInfo
  chainId: ChainId
}

export function* signWcRequest(params: SignMessageParams | SignTransactionParams) {
  const { sessionId, requestInternalId, account, method, chainId } = params
  try {
    const signerManager = yield* call(getSignerManager)
    let signature = ''
    if (method === EthMethod.PersonalSign || method === EthMethod.EthSign) {
      signature = yield* call(signMessage, params.message, account, signerManager)
    } else if (method === EthMethod.SignTypedData || method === EthMethod.SignTypedDataV4) {
      signature = yield* call(signTypedDataMessage, params.message, account, signerManager)
    } else if (method === EthMethod.EthSendTransaction) {
      const txParams: SendTransactionParams = {
        chainId: params.transaction.chainId || ChainId.Mainnet,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.WCConfirm,
          dapp: params.dapp,
        },
      }
      const { transactionResponse } = yield* call(sendTransaction, txParams)
      signature = transactionResponse.hash
    }

    if (params.dapp.source === 'walletconnect') {
      yield* call(wcWeb3Wallet.respondSessionRequest, {
        topic: sessionId,
        response: {
          id: Number(requestInternalId),
          jsonrpc: '2.0',
          result: signature,
        },
      })
    } else if (params.dapp.source === 'uwulink' && params.dapp.webhook) {
      fetch(params.dapp.webhook, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method: 'eth_sendTransaction', response: signature }),
        // TODO: consider adding analytics to track UwuLink usage
      }).catch((error) =>
        logger.error(error, {
          tags: { file: 'walletConnect/saga', function: 'signWcRequest/uwulink' },
        })
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
        imageUrl: params.dapp.icon,
        chainId,
        address: account.address,
      })
    )
    logger.error(error, { tags: { file: 'walletConnect/saga', function: 'signWcRequest' } })
  }
}

export const { wrappedSaga: signWcRequestSaga, actions: signWcRequestActions } = createSaga(
  signWcRequest,
  'signWalletConnect'
)
