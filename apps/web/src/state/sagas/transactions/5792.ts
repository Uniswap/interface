import { JsonRpcSigner } from '@ethersproject/providers'
import { getAccount } from '@wagmi/core'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { getRoutingForTransaction } from 'state/activity/utils'
import { getSigner, watchForInterruption } from 'state/sagas/transactions/utils'
import { handleGetCapabilities } from 'state/walletCapabilities/lib/handleGetCapabilities'
import { setCapabilitiesByChain } from 'state/walletCapabilities/reducer'
import { call, put } from 'typed-redux-saga'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { HandleOnChainStepParams, OnChainTransactionStepBatched } from 'uniswap/src/features/transactions/steps/types'
import {
  InterfaceTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

const CURRENT_SEND_CALLS_VERSION = '2.0.0'
async function sendCalls(params: {
  signer: JsonRpcSigner
  batchedTxRequests: ValidatedTransactionRequest[]
  from: string
  chainId: number
}): Promise<string> {
  const { signer, batchedTxRequests, from } = params
  const chainId = `0x${params.chainId.toString(16)}`

  // the `calls` array passed to sendCalls expects entries to only define `to`, `data`, and `value`
  const calls = batchedTxRequests.map(({ to, data, value }) => ({ to, data, value }))
  const result = await signer.provider.send('wallet_sendCalls', [
    { version: CURRENT_SEND_CALLS_VERSION, calls, from, chainId, atomicRequired: true },
  ])

  return result.id as string
}

export function* handleAtomicSendCalls(
  params: Omit<HandleOnChainStepParams, 'step'> & {
    step: OnChainTransactionStepBatched
    disableOneClickSwap: () => void
  },
) {
  const { step, info, account, ignoreInterrupt, disableOneClickSwap } = params
  const from = account.address
  const { batchedTxRequests } = step
  const chainId = batchedTxRequests[0].chainId

  try {
    // Add a watcher to check if the transaction flow during user input
    const { throwIfInterrupted } = yield* watchForInterruption(ignoreInterrupt)

    const signer = yield* call(getSigner, account.address)
    const batchId = yield* call(() => sendCalls({ signer, batchedTxRequests, from, chainId }))

    const connectorId = getAccount(wagmiConfig).connector?.id
    const batchInfo = { connectorId, batchId, chainId }

    // Add transaction to local state to start polling for status
    yield* put(
      addTransaction({
        id: batchId,
        hash: batchId,
        from: account.address,
        typeInfo: info,
        chainId,
        batchInfo,
        routing: getRoutingForTransaction(info),
        transactionOriginType: TransactionOriginType.Internal,
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
        options: {
          request: {
            to: batchedTxRequests[0].to,
            from: account.address,
            data: batchedTxRequests[0].data,
            value: batchedTxRequests[0].value,
            gasLimit: batchedTxRequests[0].gasLimit,
            gasPrice: batchedTxRequests[0].gasPrice,
            nonce: batchedTxRequests[0].nonce,
            chainId: batchedTxRequests[0].chainId,
          },
        },
      } satisfies InterfaceTransactionDetails),
    )

    popupRegistry.addPopup({ type: PopupType.Transaction, hash: batchId }, batchId)

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
      disableOneClickSwap()
    }
    throw error
  }
}

// TODO(WEB-7784): Remove once MetaMask fixes their error -32603 response code
function isMetaMaskNonTypicalRejection(error: any): boolean {
  return didUserReject(error) && error.code === -32603
}
