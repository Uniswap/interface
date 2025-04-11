import { LiquidityEventName } from '@uniswap/analytics-events'
import { getLiquidityEventName } from 'components/Liquidity/analytics'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import {
  handleApprovalTransactionStep,
  handleOnChainStep,
  HandleOnChainStepParams,
  handleSignatureStep,
} from 'state/sagas/transactions/utils'
import {
  CollectFeesTransactionInfo,
  CreatePositionTransactionInfo,
  DecreaseLiquidityTransactionInfo,
  IncreaseLiquidityTransactionInfo,
  MigrateV3LiquidityToV4TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import invariant from 'tiny-invariant'
import { call } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import {
  LiquidityAction,
  LiquidityTransactionType,
  ValidatedLiquidityTxContext,
} from 'uniswap/src/features/transactions/liquidity/types'
import {
  CollectFeesTransactionStep,
  DecreasePositionTransactionStep,
  IncreasePositionTransactionStep,
  IncreasePositionTransactionStepAsync,
  MigratePositionTransactionStep,
  MigratePositionTransactionStepAsync,
  TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/swap/types/steps'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { generateTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { currencyId } from 'utils/currencyId'

type LiquidityParams = {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  account: SignerMnemonicAccountMeta
  analytics?:
    | Omit<UniverseEventProperties[LiquidityEventName.ADD_LIQUIDITY_SUBMITTED], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.MIGRATE_LIQUIDITY_SUBMITTED], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED], 'transaction_hash'>
  liquidityTxContext: ValidatedLiquidityTxContext
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  onSuccess: () => void
  onFailure: () => void
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
    step.type === TransactionStepType.DecreasePositionTransaction ||
    step.type === TransactionStepType.MigratePositionTransactionStep ||
    step.type === TransactionStepType.CollectFeesTransactionStep
  ) {
    return step.txRequest
  }

  if (!signature) {
    throw new Error('Signature required for async increase position transaction step')
  }

  const txRequest = yield* call(step.getTxRequest, signature)
  invariant(txRequest !== undefined, 'txRequest must be defined')

  return txRequest
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
    | Omit<UniverseEventProperties[LiquidityEventName.ADD_LIQUIDITY_SUBMITTED], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.MIGRATE_LIQUIDITY_SUBMITTED], 'transaction_hash'>
    | Omit<UniverseEventProperties[LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED], 'transaction_hash'>
}
function* handlePositionTransactionStep(params: HandlePositionStepParams) {
  const { action, step, signature, analytics } = params
  const info = getLiquidityTransactionInfo(action)
  const txRequest = yield* call(getLiquidityTxRequest, step, signature)

  const onModification = ({ hash, data }: { hash: string; data: string }) => {
    if (analytics) {
      sendAnalyticsEvent(LiquidityEventName.TRANSACTION_MODIFIED_IN_WALLET, {
        ...analytics,
        transaction_hash: hash,
        expected: txRequest.data?.toString(),
        actual: data,
      })
    }
  }

  // Now that we have the txRequest, we can create a definitive LiquidityTransactionStep, incase we started with an async step.
  const onChainStep = { ...step, txRequest }
  const hash = yield* call(handleOnChainStep, {
    ...params,
    info,
    step: onChainStep,
    shouldWaitForConfirmation: false,
    onModification,
  })

  if (analytics) {
    sendAnalyticsEvent(getLiquidityEventName(onChainStep.type), {
      ...analytics,
      transaction_hash: hash,
    } satisfies
      | UniverseEventProperties[LiquidityEventName.ADD_LIQUIDITY_SUBMITTED]
      | UniverseEventProperties[LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED]
      | UniverseEventProperties[LiquidityEventName.MIGRATE_LIQUIDITY_SUBMITTED]
      | UniverseEventProperties[LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED])
  }

  popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)
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
  } = params

  let signature: string | undefined

  try {
    for (const step of steps) {
      switch (step.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          yield* call(handleApprovalTransactionStep, { account, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Signature: {
          signature = yield* call(handleSignatureStep, { account, step, setCurrentStep })
          break
        }
        case TransactionStepType.IncreasePositionTransaction:
        case TransactionStepType.IncreasePositionTransactionAsync:
        case TransactionStepType.DecreasePositionTransaction:
        case TransactionStepType.MigratePositionTransactionStep:
        case TransactionStepType.MigratePositionTransactionStepAsync:
        case TransactionStepType.CollectFeesTransactionStep:
          yield* call(handlePositionTransactionStep, { account, step, setCurrentStep, action, signature, analytics })
          break
        default: {
          throw new Error('Unexpected step type')
        }
      }
    }
  } catch (e: unknown) {
    const cause = e instanceof Error && e.cause // this will contain the trading api error and requestID
    logger.error(e, { tags: { file: 'liquiditySaga', function: 'modifyLiquidity' }, extra: { tradingApiError: cause } })
    onFailure()
    return
  }

  yield* call(onSuccess)
}

function* liquidity(params: LiquidityParams) {
  const { liquidityTxContext, startChainId, selectChain, onFailure } = params

  const steps = yield* call(generateTransactionSteps, liquidityTxContext)
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
  | IncreaseLiquidityTransactionInfo
  | DecreaseLiquidityTransactionInfo
  | MigrateV3LiquidityToV4TransactionInfo
  | CreatePositionTransactionInfo
  | CollectFeesTransactionInfo {
  let type: TransactionType
  switch (action.type) {
    case LiquidityTransactionType.Create:
      type = TransactionType.CREATE_POSITION
      break
    case LiquidityTransactionType.Increase:
      type = TransactionType.INCREASE_LIQUIDITY
      break
    case LiquidityTransactionType.Decrease:
      type = TransactionType.DECREASE_LIQUIDITY
      break
    case LiquidityTransactionType.Migrate:
      type = TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4
      break
    case LiquidityTransactionType.Collect:
      type = TransactionType.COLLECT_FEES
  }

  const {
    currency0Amount: { currency: currency0, quotient: quotient0 },
    currency1Amount: { currency: currency1, quotient: quotient1 },
  } = action
  return {
    type,
    token0CurrencyId: currencyId(currency0),
    token1CurrencyId: currencyId(currency1),
    token0CurrencyAmountRaw: quotient0.toString(),
    token1CurrencyAmountRaw: quotient1.toString(),
  }
}
