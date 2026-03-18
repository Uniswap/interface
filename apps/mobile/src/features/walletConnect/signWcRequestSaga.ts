/* eslint-disable complexity */
import { buildAuthObject, getSdkError } from '@walletconnect/utils'
import { providers } from 'ethers'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  TransactionRequest,
  UwuLinkErc20Request,
  WalletSendCallsEncodedRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { call, put } from 'typed-redux-saga'
import { AssetType } from 'uniswap/src/entities/assets'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod, EthSignMethod } from 'uniswap/src/features/dappRequests/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { TransactionOriginType, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DappRequestInfo, DappRequestType, UwULinkMethod, WalletConnectEvent } from 'uniswap/src/types/walletConnect'
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
  dappRequestInfo: DappRequestInfo
  chainId: UniverseChainId
}

type SignTransactionParams = {
  sessionId: string
  requestInternalId: string
  transaction: providers.TransactionRequest
  account: SignerMnemonicAccountMeta
  method: EthMethod.EthSendTransaction | EthMethod.WalletSendCalls
  dappRequestInfo: DappRequestInfo
  chainId: UniverseChainId
  request: TransactionRequest | UwuLinkErc20Request | WalletSendCallsEncodedRequest
}

function* signWcRequest(params: SignMessageParams | SignTransactionParams) {
  const { sessionId, requestInternalId, account, method, chainId } = params
  const { defaultChainId } = yield* getEnabledChainIdsSaga(Platform.EVM)
  try {
    const signerManager = yield* call(getSignerManager)
    let result: string | SendCallsResult = ''
    if (method === EthMethod.PersonalSign || method === EthMethod.EthSign) {
      // For personal_sign, pass signAsString=true to keep the message as a string for proper EIP-191 hashing
      result = yield* call(signMessage, {
        message: params.message,
        account,
        signerManager,
        signAsString: method === EthMethod.PersonalSign,
      })

      // TODO: add `isCheckIn` type to uwulink request info so that this can be generalized
      if (
        params.dappRequestInfo.requestType === DappRequestType.UwULink &&
        params.dappRequestInfo.name === 'Uniswap Cafe'
      ) {
        yield* put(
          pushNotification({
            type: AppNotificationType.Success,
            title: 'Checked in',
          }),
        )
      }
    } else if (method === EthMethod.SignTypedData || method === EthMethod.SignTypedDataV4) {
      result = yield* call(signTypedDataMessage, { message: params.message, account, signerManager })
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
      const { transactionHash } = yield* call(executeTransaction, txParams)
      result = transactionHash
    } else if (method === EthMethod.EthSendTransaction) {
      const txParams: ExecuteTransactionParams = {
        chainId: params.transaction.chainId || defaultChainId,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.WCConfirm,
          dappRequestInfo: params.dappRequestInfo,
        },
        transactionOriginType: TransactionOriginType.External,
      }
      const { transactionHash } = yield* call(executeTransaction, txParams)
      result = transactionHash

      // Trigger a pending transaction notification after we send the transaction to chain
      yield* put(
        pushNotification({
          type: AppNotificationType.TransactionPending,
          chainId: txParams.chainId,
        }),
      )
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (method === EthMethod.WalletSendCalls && params.request.type === EthMethod.WalletSendCalls) {
      const txParams: ExecuteTransactionParams = {
        chainId: params.request.chainId,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.WCConfirm,
          dappRequestInfo: params.dappRequestInfo,
        },
        transactionOriginType: TransactionOriginType.External,
      }

      const { transactionHash } = yield* call(executeTransaction, txParams)
      result = {
        id: params.request.id,
        capabilities: {
          caip345: {
            caip2: `eip155:${params.request.chainId}`,
            transactionHashes: [transactionHash],
          },
        },
      }

      // Store the batch transaction in Redux
      yield* put(
        addBatchedTransaction({
          batchId: params.request.id,
          txHashes: [transactionHash],
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

    if (params.dappRequestInfo.requestType === DappRequestType.WalletConnectAuthenticationRequest) {
      const iss = `eip155:${chainId}:${account.address}`

      // Check if signature is a string, if not throw an error
      if (typeof result !== 'string') {
        throw new Error('Expected signature to be a string in WalletConnectAuthenticationRequest')
      }

      const auth = buildAuthObject(
        params.dappRequestInfo.authPayload,
        {
          t: 'eip191',
          s: result,
        },
        iss,
      )
      yield* call(wcWeb3Wallet.approveSessionAuthenticate, {
        id: Number(sessionId),
        auths: [auth],
      })
    } else if (params.dappRequestInfo.requestType === DappRequestType.WalletConnectSessionRequest) {
      yield* call(wcWeb3Wallet.respondSessionRequest, {
        topic: sessionId,
        response: {
          id: Number(requestInternalId),
          jsonrpc: '2.0',
          result,
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (params.dappRequestInfo.requestType === DappRequestType.UwULink && params.dappRequestInfo.webhook) {
      fetch(params.dappRequestInfo.webhook, {
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
    if (params.dappRequestInfo.requestType === DappRequestType.WalletConnectSessionRequest) {
      yield* call(wcWeb3Wallet.respondSessionRequest, {
        topic: sessionId,
        response: {
          id: Number(requestInternalId),
          jsonrpc: '2.0',
          error: { code: 5000, message: `Signing error: ${error}` },
        },
      })
    } else if (params.dappRequestInfo.requestType === DappRequestType.WalletConnectAuthenticationRequest) {
      yield* call(wcWeb3Wallet.rejectSessionAuthenticate, {
        id: Number(sessionId),
        reason: getSdkError('USER_REJECTED'),
      })
    }

    yield* put(
      pushNotification({
        type: AppNotificationType.WalletConnect,
        event: WalletConnectEvent.TransactionFailed,
        dappName: params.dappRequestInfo.name,
        imageUrl: params.dappRequestInfo.icon ?? null,
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
