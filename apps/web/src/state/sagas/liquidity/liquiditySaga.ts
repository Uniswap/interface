import {
  GetLPPriceDiscrepancyRequest,
  GetLPPriceDiscrepancyResponse,
} from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { getLiquidityEventName } from 'components/Liquidity/analytics'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { handleAtomicSendCalls } from 'state/sagas/transactions/5792'
import {
  getDisplayableError,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
} from 'state/sagas/transactions/utils'
import invariant from 'tiny-invariant'
import { call, delay, spawn } from 'typed-redux-saga'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName, LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import type { CollectFeesTransactionStep } from 'uniswap/src/features/transactions/liquidity/steps/collectFees'
import type { DecreasePositionTransactionStep } from 'uniswap/src/features/transactions/liquidity/steps/decreasePosition'
import { generateLPTransactionSteps } from 'uniswap/src/features/transactions/liquidity/steps/generateLPTransactionSteps'
import type {
  IncreasePositionTransactionStep,
  IncreasePositionTransactionStepAsync,
  IncreasePositionTransactionStepBatched,
} from 'uniswap/src/features/transactions/liquidity/steps/increasePosition'
import type {
  MigratePositionTransactionStep,
  MigratePositionTransactionStepAsync,
} from 'uniswap/src/features/transactions/liquidity/steps/migrate'
import type { LiquidityAction, ValidatedLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import type { HandleOnChainStepParams, TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type {
  CollectFeesTransactionInfo,
  CreatePoolTransactionInfo,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  MigrateV3LiquidityToV4TransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { currencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'

type LiquidityParams = {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  account: SignerMnemonicAccountDetails
  analytics?:
    | Omit<UniverseEventProperties[LiquidityEventName.AddLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.RemoveLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.MigrateLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.CollectLiquiditySubmitted], 'transaction_hash'>
  liquidityTxContext: ValidatedLiquidityTxContext
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  onSuccess: () => void
  onFailure: (e?: unknown) => void
  disableOneClickSwap?: () => void
}

function* getLiquidityTxRequest(
  step:
    | IncreasePositionTransactionStep
    | IncreasePositionTransactionStepAsync
    | DecreasePositionTransactionStep
    | MigratePositionTransactionStep
    | MigratePositionTransactionStepAsync
    | CollectFeesTransactionStep,
  signature: string | undefined,
) {
  if (
    step.type === TransactionStepType.IncreasePositionTransaction ||
    step.type === TransactionStepType.DecreasePositionTransaction
  ) {
    return {
      txRequest: step.txRequest,
      sqrtRatioX96: step.sqrtRatioX96,
    }
  }
  if (
    step.type === TransactionStepType.MigratePositionTransaction ||
    step.type === TransactionStepType.CollectFeesTransactionStep
  ) {
    return { txRequest: step.txRequest }
  }

  if (!signature) {
    throw new Error('Signature required for async increase position transaction step')
  }

  const { txRequest, sqrtRatioX96 } = yield* call(step.getTxRequest, signature)
  invariant(txRequest !== undefined, 'txRequest must be defined')

  return { txRequest, sqrtRatioX96 }
}

interface HandlePositionStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step:
    | IncreasePositionTransactionStep
    | IncreasePositionTransactionStepAsync
    | DecreasePositionTransactionStep
    | MigratePositionTransactionStep
    | MigratePositionTransactionStepAsync
    | CollectFeesTransactionStep
  signature?: string
  action: LiquidityAction
  analytics?:
    | Omit<UniverseEventProperties[LiquidityEventName.AddLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.RemoveLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.MigrateLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.CollectLiquiditySubmitted], 'transaction_hash'>
}
function* handlePositionTransactionStep(params: HandlePositionStepParams) {
  const { action, step, signature, analytics } = params
  const info = getLiquidityTransactionInfo(action)
  const { txRequest, sqrtRatioX96 } = yield* call(getLiquidityTxRequest, step, signature)

  const onModification = ({ hash, data }: { hash: string; data: string }) => {
    if (analytics) {
      sendAnalyticsEvent(LiquidityEventName.TransactionModifiedInWallet, {
        ...analytics,
        transaction_hash: hash,
        expected: txRequest.data?.toString(),
        actual: data,
      })
    }
  }

  // Now that we have the txRequest, we can create a definitive LiquidityTransactionStep, incase we started with an async step.
  const onChainStep = { ...step, txRequest }
  let hash: string | undefined
  try {
    hash = yield* call(handleOnChainStep, {
      ...params,
      info,
      step: onChainStep,
      shouldWaitForConfirmation: false,
      onModification,
    })
  } catch (e) {
    if (analytics) {
      sendAnalyticsEvent(InterfaceEventName.OnChainAddLiquidityFailed, {
        ...analytics,
        message: e.message,
      })
    }

    throw e
  }

  if (analytics) {
    sendAnalyticsEvent(getLiquidityEventName(onChainStep.type), {
      ...analytics,
      transaction_hash: hash,
    } satisfies
      | UniverseEventProperties[LiquidityEventName.AddLiquiditySubmitted]
      | UniverseEventProperties[LiquidityEventName.RemoveLiquiditySubmitted]
      | UniverseEventProperties[LiquidityEventName.MigrateLiquiditySubmitted]
      | UniverseEventProperties[LiquidityEventName.CollectLiquiditySubmitted])

    // Don't block the main flow, spawn a new task for polling LP price discrepancy
    yield* spawn(function* () {
      if (hash && sqrtRatioX96 && txRequest.chainId === UniverseChainId.Mainnet) {
        try {
          const priceDiscrepancyResponse: GetLPPriceDiscrepancyResponse = yield* call(pollForLPPriceDiscrepancy, {
            hash,
            chainId: txRequest.chainId,
            sqrtRatioX96,
            analytics,
          })

          sendAnalyticsEvent(LiquidityEventName.PriceDiscrepancyChecked, {
            ...analytics,
            event_name: getLiquidityEventName(onChainStep.type),
            transaction_hash: hash,
            status: priceDiscrepancyResponse.status,
            sqrt_ratio_x96_before: priceDiscrepancyResponse.sqrtRatioX96Before,
            sqrt_ratio_x96_after: priceDiscrepancyResponse.sqrtRatioX96After,
            price_discrepancy: priceDiscrepancyResponse.percentPriceDifference,
            absolute_price_discrepancy: Math.abs(Number(priceDiscrepancyResponse.percentPriceDifference)),
          })
        } catch (error) {
          // Don't break the main flow if price discrepancy call fails
          logger.info('liquiditySaga', 'handlePositionTransactionStep', 'Failed to get LP price discrepancy', {
            extra: { hash, error: error.message },
          })
        }
      }
    })
  }

  popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)
}

interface HandlePositionBatchedStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step: IncreasePositionTransactionStepBatched
  disableOneClickSwap?: () => void
  action: LiquidityAction
  analytics?:
    | Omit<UniverseEventProperties[LiquidityEventName.AddLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.RemoveLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.MigrateLiquiditySubmitted], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.CollectLiquiditySubmitted], 'transaction_hash'>
}
function* handlePositionTransactionBatchedStep(params: HandlePositionBatchedStepParams) {
  const { action, step, analytics, disableOneClickSwap } = params

  const info = getLiquidityTransactionInfo(action)

  const batchId = yield* handleAtomicSendCalls({
    ...params,
    info,
    step,
    ignoreInterrupt: true,
    shouldWaitForConfirmation: false,
    disableOneClickSwap,
  })

  if (analytics) {
    sendAnalyticsEvent(getLiquidityEventName(TransactionStepType.IncreasePositionTransaction), {
      ...analytics,
      transaction_hash: batchId,
    } satisfies
      | UniverseEventProperties[LiquidityEventName.AddLiquiditySubmitted]
      | UniverseEventProperties[LiquidityEventName.RemoveLiquiditySubmitted]
      | UniverseEventProperties[LiquidityEventName.MigrateLiquiditySubmitted]
      | UniverseEventProperties[LiquidityEventName.CollectLiquiditySubmitted])
  }

  popupRegistry.addPopup({ type: PopupType.Transaction, hash: batchId }, batchId)
}

function* modifyLiquidity(params: LiquidityParams & { steps: TransactionStep[] }) {
  const {
    account,
    setCurrentStep,
    steps,
    liquidityTxContext: { action },
    onSuccess,
    onFailure,
    analytics,
    disableOneClickSwap,
  } = params

  let signature: string | undefined

  for (const step of steps) {
    try {
      switch (step.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          yield* call(handleApprovalTransactionStep, { address: account.address, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Signature: {
          signature = yield* call(handleSignatureStep, { address: account.address, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Transaction: {
          yield* call(handlePermitTransactionStep, { address: account.address, step, setCurrentStep })
          break
        }
        case TransactionStepType.IncreasePositionTransaction:
        case TransactionStepType.IncreasePositionTransactionAsync:
        case TransactionStepType.DecreasePositionTransaction:
        case TransactionStepType.MigratePositionTransaction:
        case TransactionStepType.MigratePositionTransactionAsync:
        case TransactionStepType.CollectFeesTransactionStep:
          yield* call(handlePositionTransactionStep, {
            address: account.address,
            step,
            setCurrentStep,
            action,
            signature,
            analytics,
          })
          break
        case TransactionStepType.IncreasePositionTransactionBatched:
          yield* call(handlePositionTransactionBatchedStep, {
            address: account.address,
            step,
            setCurrentStep,
            action,
            analytics,
            disableOneClickSwap,
          })
          break
        default: {
          throw new Error('Unexpected step type')
        }
      }
    } catch (e) {
      const displayableError = getDisplayableError({ error: e, step, flow: 'liquidity' })

      if (displayableError) {
        logger.error(displayableError, { tags: { file: 'liquiditySaga', function: 'modifyLiquidity' } })
        onFailure(e)
      } else {
        onFailure()
      }

      return
    }
  }

  yield* call(onSuccess)
}

function* liquidity(params: LiquidityParams) {
  const { liquidityTxContext, startChainId, selectChain, onFailure } = params

  const steps = yield* call(generateLPTransactionSteps, liquidityTxContext)
  params.setSteps(steps)

  // Switch chains if needed
  const token0ChainId = liquidityTxContext.action.currency0Amount.currency.chainId
  const token1ChainId = liquidityTxContext.action.currency1Amount.currency.chainId

  if (token0ChainId !== token1ChainId) {
    logger.error('Tokens must be on the same chain', {
      tags: { file: 'liquiditySaga', function: 'liquidity' },
    })
    onFailure()
    return undefined
  }

  if (token0ChainId !== startChainId) {
    const chainSwitched = yield* call(selectChain, token0ChainId)
    if (!chainSwitched) {
      onFailure()
      return undefined
    }
  }

  return yield* modifyLiquidity({
    ...params,
    steps,
  })
}

export const liquiditySaga = createSaga(liquidity, 'liquiditySaga')

function getLiquidityTransactionInfo(
  action: LiquidityAction,
):
  | LiquidityIncreaseTransactionInfo
  | LiquidityDecreaseTransactionInfo
  | MigrateV3LiquidityToV4TransactionInfo
  | CreatePoolTransactionInfo
  | CollectFeesTransactionInfo {
  let type: TransactionType
  switch (action.type) {
    case LiquidityTransactionType.Create:
      type = TransactionType.CreatePool
      break
    case LiquidityTransactionType.Increase:
      type = TransactionType.LiquidityIncrease
      break
    case LiquidityTransactionType.Decrease:
      type = TransactionType.LiquidityDecrease
      break
    case LiquidityTransactionType.Migrate:
      type = TransactionType.MigrateLiquidityV3ToV4
      break
    case LiquidityTransactionType.Collect:
      type = TransactionType.CollectFees
  }

  const {
    currency0Amount: { currency: currency0, quotient: quotient0 },
    currency1Amount: { currency: currency1, quotient: quotient1 },
  } = action
  return {
    type,
    currency0Id: currencyId(currency0),
    currency1Id: currencyId(currency1),
    currency0AmountRaw: quotient0.toString(),
    currency1AmountRaw: quotient1.toString(),
  }
}

function* pollForLPPriceDiscrepancy(params: {
  hash: string
  chainId: number
  sqrtRatioX96: string
  analytics: NonNullable<HandlePositionStepParams['analytics']>
}) {
  const { hash, chainId, sqrtRatioX96, analytics } = params

  let attempt = 1
  const maxAttempts = 10
  const baseDelay = 2_000 // Start with 2 seconds
  const maxDelay = 15_000 // Cap at 15 seconds

  yield* delay(baseDelay)

  // Polling is required because the BE cannot wait for the transaction to be confirmed
  // without throwing a timeout error.
  while (attempt < maxAttempts) {
    try {
      const priceDiscrepancyResponse: GetLPPriceDiscrepancyResponse = yield* call(
        TradingApiClient.getLPPriceDiscrepancy,
        new GetLPPriceDiscrepancyRequest({
          txnHash: hash,
          chainId,
          token0: isNativeCurrencyAddress(chainId, analytics.baseCurrencyId) ? ZERO_ADDRESS : analytics.baseCurrencyId,
          token1: isNativeCurrencyAddress(chainId, analytics.quoteCurrencyId)
            ? ZERO_ADDRESS
            : analytics.quoteCurrencyId,
          tickSpacing: analytics.tick_spacing,
          fee: analytics.fee_tier,
          hooks: analytics.hook,
          sqrtRatioX96,
          // @ts-expect-error endpoint excepts a string
          protocol: analytics.type,
        }),
      )

      return priceDiscrepancyResponse
    } catch (error) {
      const errorMessage = JSON.stringify(error)

      // If it's not a "Transaction receipt not found" error, don't retry
      if (!errorMessage.includes('Transaction receipt not found')) {
        throw error
      }

      // If we've exhausted all attempts, throw the error
      if (attempt >= maxAttempts) {
        throw error
      }

      // Calculate exponential backoff delay
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)

      logger.info(
        'liquiditySaga',
        'pollForLPPriceDiscrepancy',
        `Transaction receipt not found, retrying in ${exponentialDelay}ms (attempt ${attempt + 1}/${maxAttempts})`,
        { extra: { hash } },
      )

      yield* delay(exponentialDelay)
      attempt++
    }
  }

  throw new Error('Max polling attempts reached')
}
