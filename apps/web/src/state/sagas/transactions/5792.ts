import { JsonRpcSigner } from '@ethersproject/providers'
import { TradingApi } from '@universe/api'
import { numberToHex } from '@universe/encoding'
import { getAccount } from '@wagmi/core'
import { call, put } from 'typed-redux-saga'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import {
  HandleOnChainStepParams,
  OnChainTransactionStepWalletCall,
} from 'uniswap/src/features/transactions/steps/types'
import {
  InterfaceTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { SendCallsResultSchema } from 'wallet/src/features/dappRequests/types'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { getRoutingForTransaction } from '~/state/activity/utils'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { getSigner, watchForInterruption } from '~/state/sagas/transactions/utils'
import { handleGetCapabilities } from '~/state/walletCapabilities/lib/handleGetCapabilities'
import { setCapabilitiesByChain } from '~/state/walletCapabilities/reducer'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

const TRANSACTION_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/

/** CAIP-345: wallets may return the real on-chain tx hash(es) alongside the batch id in the wallet_sendCalls result. */
export function parseCaip345TransactionHash(result: unknown): string | undefined {
  const parsed = SendCallsResultSchema.safeParse(result)
  const hash = parsed.data?.capabilities?.caip345?.transactionHashes[0]
  return hash !== undefined && TRANSACTION_HASH_REGEX.test(hash) ? hash : undefined
}

const CURRENT_SEND_CALLS_VERSION = '2.0.0'
async function sendCalls(params: {
  signer: JsonRpcSigner
  walletCallTxRequests: ValidatedTransactionRequest[]
  from: string
  chainId: number
  paymasterService?: TradingApi.PaymasterServiceCapability
}): Promise<{ batchId: string; onChainHash?: string }> {
  const { signer, walletCallTxRequests, from, paymasterService } = params
  const chainId = numberToHex(params.chainId)

  // the `calls` array passed to sendCalls expects entries to only define `to`, `data`, and `value`
  const calls = walletCallTxRequests.map(({ to, data, value }) => ({ to, data, value }))
  const capabilities = paymasterService
    ? { paymasterService: { url: paymasterService.url, context: paymasterService.context } }
    : undefined
  const result = await signer.provider.send('wallet_sendCalls', [
    { version: CURRENT_SEND_CALLS_VERSION, calls, from, chainId, atomicRequired: true, capabilities },
  ])

  return { batchId: result.id as string, onChainHash: parseCaip345TransactionHash(result) }
}

export function* handleAtomicSendCalls(
  params: Omit<HandleOnChainStepParams, 'step'> & {
    step: OnChainTransactionStepWalletCall
    disableOneClickSwap?: () => void
  },
) {
  const { step, info, address, ignoreInterrupt, disableOneClickSwap, planId } = params
  const { walletCallTxRequests, paymasterService } = step
  const chainId = walletCallTxRequests[0].chainId

  try {
    // Add a watcher to check if the transaction flow during user input
    const { throwIfInterrupted } = yield* watchForInterruption(ignoreInterrupt)

    const signer = yield* call(getSigner, address)
    const { batchId, onChainHash } = yield* call(() =>
      sendCalls({ signer, walletCallTxRequests, from: address, chainId, paymasterService }),
    )

    const connectorId = getAccount(wagmiConfig).connector?.id
    const batchInfo = { connectorId, batchId, chainId, planId }

    // Add transaction to local state to start polling for status
    yield* put(
      addTransaction({
        // batchId stays the record id (the wallet_getCallsStatus polling key); hash carries the real
        // tx hash when the wallet provides it, else the batch poller backfills it on confirmation.
        id: batchId,
        hash: onChainHash ?? batchId,
        from: address,
        typeInfo: info,
        chainId,
        batchInfo,
        routing: getRoutingForTransaction(info),
        transactionOriginType: TransactionOriginType.Internal,
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
        options: {
          request: {
            to: walletCallTxRequests[0].to,
            from: address,
            data: walletCallTxRequests[0].data,
            value: walletCallTxRequests[0].value,
            gasLimit: walletCallTxRequests[0].gasLimit,
            gasPrice: walletCallTxRequests[0].gasPrice,
            nonce: walletCallTxRequests[0].nonce,
            chainId: walletCallTxRequests[0].chainId,
          },
        },
      } satisfies InterfaceTransactionDetails),
    )

    if (!planId) {
      popupRegistry.addPopup({ type: PopupType.Transaction, hash: batchId }, batchId)
    }

    // If the transaction flow was interrupted, throw an error after the step has completed
    yield* call(throwIfInterrupted)

    return batchId
  } catch (error) {
    // Specific handling for when the user rejects
    if (error.code === 5750 || isMetaMaskNonTypicalRejection(error)) {
      const updatedCapabilities = yield* call(handleGetCapabilities)
      if (updatedCapabilities) {
        // A wallet may update its capabilities after a delegation is rejected, so we refresh state here such subsequent transactions use the updated capabilities
        yield* put(setCapabilitiesByChain(updatedCapabilities))
      }
      // If the user tries again,
      disableOneClickSwap?.()
    }
    throw error
  }
}

// TODO(WEB-7784): Remove once MetaMask fixes their error -32603 response code
function isMetaMaskNonTypicalRejection(error: any): boolean {
  return didUserReject(error) && error.code === -32603
}
