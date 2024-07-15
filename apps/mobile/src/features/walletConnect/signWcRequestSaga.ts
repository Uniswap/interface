import { providers } from 'ethers'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { TransactionRequest, UwuLinkErc20Request } from 'src/features/walletConnect/walletConnectSlice'
import { call, put } from 'typed-redux-saga'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { DappInfo, EthMethod, EthSignMethod, UwULinkMethod, WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { SendTransactionParams, sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { TransactionType } from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getSignerManager } from 'wallet/src/features/wallet/context'
import { signMessage, signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'
import { createSaga } from 'wallet/src/utils/saga'

type SignMessageParams = {
  sessionId: string
  requestInternalId: string
  message: string
  account: Account
  method: EthSignMethod
  dapp: DappInfo
  chainId: WalletChainId
}

type SignTransactionParams = {
  sessionId: string
  requestInternalId: string
  transaction: providers.TransactionRequest
  account: Account
  method: EthMethod.EthSendTransaction
  dapp: DappInfo
  chainId: WalletChainId
  request: TransactionRequest | UwuLinkErc20Request
}

export function* signWcRequest(params: SignMessageParams | SignTransactionParams) {
  const { sessionId, requestInternalId, account, method, chainId } = params
  try {
    const signerManager = yield* call(getSignerManager)
    let signature = ''
    if (method === EthMethod.PersonalSign || method === EthMethod.EthSign) {
      signature = yield* call(signMessage, params.message, account, signerManager)

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
      signature = yield* call(signTypedDataMessage, params.message, account, signerManager)
    } else if (method === EthMethod.EthSendTransaction && params.request.type === UwULinkMethod.Erc20Send) {
      const txParams: SendTransactionParams = {
        chainId: params.transaction.chainId || UniverseChainId.Mainnet,
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
      }
      const { transactionResponse } = yield* call(sendTransaction, txParams)
      signature = transactionResponse.hash
    } else if (method === EthMethod.EthSendTransaction) {
      const txParams: SendTransactionParams = {
        chainId: params.transaction.chainId || UniverseChainId.Mainnet,
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
        body: JSON.stringify({ method: params.method, response: signature, chainId }),
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
