import { VersionedTransaction } from '@solana/web3.js'
import { JupiterExecuteResponse, TradingApi } from '@universe/api'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { signSolanaTransactionWithCurrentWallet } from 'components/Web3Provider/signSolanaTransaction'
import store from 'state'
import { getSwapTransactionInfo } from 'state/sagas/transactions/utils'
import { call, delay, spawn } from 'typed-redux-saga'
import { JupiterApiClient } from 'uniswap/src/data/apiClients/jupiterApi/JupiterFetchClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { refetchRestQueriesViaOnchainOverrideVariant } from 'uniswap/src/features/portfolio/portfolioUpdates/rest/refetchRestQueriesViaOnchainOverrideVariantSaga'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { JupiterExecuteError } from 'uniswap/src/features/transactions/errors'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import { ValidatedSolanaSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import {
  InterfaceBaseTransactionDetails,
  SolanaTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { tryCatch } from 'utilities/src/errors'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

type JupiterSwapParams = {
  account: SignerMnemonicAccountDetails
  analytics: ExtractedBaseTradeAnalyticsProperties
  swapTxContext: ValidatedSolanaSwapTxAndGasInfo
  /** Callback to trigger after swap has been signed but before confirmation. */
  onSwapSigned?: () => void
}

async function signAndSendJupiterSwap({
  transaction,
  requestId,
  signSolanaTransaction,
  onSwapSigned,
}: {
  transaction: VersionedTransaction
  requestId: string
  signSolanaTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>
  onSwapSigned?: () => void
}): Promise<JupiterExecuteResponse> {
  const signedTransactionObj = await signSolanaTransaction(transaction)
  const signedTransaction = Buffer.from(signedTransactionObj.serialize()).toString('base64')

  onSwapSigned?.()

  const result = await JupiterApiClient.execute({ signedTransaction, requestId })

  return result
}

function* refetchBalancesWithDelay({
  transaction,
  activeAddress,
}: {
  transaction: SolanaTransactionDetails<InterfaceBaseTransactionDetails>
  activeAddress: string
}) {
  // Wait 3 seconds before refetching.
  // This is because at this point the transaction hasn't been fully confirmed yet,
  // and it should take 1-2 seconds for the balance to update onchain.
  yield* delay(3 * ONE_SECOND_MS)

  yield* call(refetchRestQueriesViaOnchainOverrideVariant, {
    transaction,
    activeAddress,
    apolloClient: null,
  })
}

function* updateAppState({
  hash,
  trade,
  from,
  swapStartTimestamp,
}: {
  hash: string
  trade: SolanaTrade
  from: string
  swapStartTimestamp?: number
}) {
  const typeInfo = getSwapTransactionInfo({ trade, swapStartTimestamp })

  const transaction: SolanaTransactionDetails<InterfaceBaseTransactionDetails> = {
    from,
    typeInfo,
    hash,
    chainId: UniverseChainId.Solana,
    routing: TradingApi.Routing.JUPITER,
    status: TransactionStatus.Success,
    addedTime: Date.now(),
    id: hash,
    transactionOriginType: TransactionOriginType.Internal,
    options: {
      request: {},
    },
  }

  store.dispatch(addTransaction(transaction))

  popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)

  // Spawn background task to refetch balances after a delay
  yield* spawn(refetchBalancesWithDelay, {
    transaction,
    activeAddress: from,
  })
}

function createJupiterSwap(signSolanaTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>) {
  return function* jupiterSwap(params: JupiterSwapParams) {
    const { swapTxContext, account, onSwapSigned, analytics } = params
    const { trade, transactionBase64 } = swapTxContext
    const { requestId } = trade.quote.quote

    const transaction = VersionedTransaction.deserialize(Buffer.from(transactionBase64, 'base64'))

    const { data, error } = yield* call(() =>
      tryCatch(signAndSendJupiterSwap({ transaction, requestId, signSolanaTransaction, onSwapSigned })),
    )

    if (error) {
      throw error
    }
    const { signature: hash, status, code, error: errorMessage } = data
    if (status !== 'Success' || !hash) {
      throw new JupiterExecuteError(errorMessage ?? 'Unknown Jupiter Execution Error', code)
    }

    yield* call(updateAppState, {
      hash,
      trade,
      from: account.address,
      swapStartTimestamp: analytics.swap_start_timestamp,
    })

    return hash
  }
}

function logJupiterSwapFinalized({
  success,
  analytics,
  hash,
  timeSigned,
  error,
}: {
  success: boolean
  analytics: ExtractedBaseTradeAnalyticsProperties
  hash?: string
  timeSigned?: number
  error?: Error
}) {
  // We log SwapSigned here, rather than immediately after signing, because the hash may be unknown until jupiter api response time.
  sendAnalyticsEvent(SwapEventName.SwapSigned, {
    ...analytics,
    time_signed: timeSigned,
    transaction_hash: hash,
  })

  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event = success ? SwapEventName.SwapTransactionCompleted : SwapEventName.SwapTransactionFailed

  sendAnalyticsEvent(event, {
    ...analytics,
    hash,
    id: hash ?? '',
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
    chain_id: analytics.chain_id_in,
    error_message: error?.message,
    error_code: error && error instanceof JupiterExecuteError ? error.code : undefined,
  })
}

function withAnalyticsLogging(swap: (params: JupiterSwapParams) => Generator<any, string>) {
  return function* withLogging(params: JupiterSwapParams) {
    let timeSigned: number | undefined
    try {
      const onSwapSigned = () => {
        timeSigned = Date.now()
        params.onSwapSigned?.()
      }

      const hash = yield* swap({ ...params, onSwapSigned })

      logJupiterSwapFinalized({ success: true, analytics: params.analytics, hash, timeSigned })
    } catch (error) {
      logJupiterSwapFinalized({ success: false, analytics: params.analytics, timeSigned, error })
      throw error
    }
  }
}

export const jupiterSwap = withAnalyticsLogging(createJupiterSwap(signSolanaTransactionWithCurrentWallet))
