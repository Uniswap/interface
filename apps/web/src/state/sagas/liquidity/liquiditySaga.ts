import { PopupType, addPopup } from 'state/application/reducer'
import {
  HandleOnChainStepParams,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handleSignatureStep,
} from 'state/sagas/transactions/utils'
import {
  DecreaseLiquidityTransactionInfo,
  IncreaseLiquidityTransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import invariant from 'tiny-invariant'
import { call, put } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { LiquidityAction, ValidatedLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import {
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
    | MigratePositionTransactionStepAsync,
  signature: string | undefined,
) {
  if (
    step.type === TransactionStepType.IncreasePositionTransaction ||
    step.type === TransactionStepType.DecreasePositionTransaction ||
    step.type === TransactionStepType.MigratePositionTransactionStep
  ) {
    return step.txRequest
  }

  if (!signature) {
    throw new Error('Signature required for async increase position transaction step')
  }

  try {
    const txRequest = yield* call(step.getTxRequest, signature)
    invariant(txRequest !== undefined)

    return txRequest
  } catch {
    throw new Error('Failed to get transaction request')
  }
}

interface HandlePositionStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step:
    | IncreasePositionTransactionStep
    | IncreasePositionTransactionStepAsync
    | DecreasePositionTransactionStep
    | MigratePositionTransactionStep
    | MigratePositionTransactionStepAsync
  signature?: string
  action: LiquidityAction
}
function* handlePositionTransactionStep(params: HandlePositionStepParams) {
  const { action, step, signature } = params
  const info = getLiquidityTransactionInfo(action, step.type)
  const txRequest = yield* call(getLiquidityTxRequest, step, signature)

  // Now that we have the txRequest, we can create a definitive LiquidityTransactionStep, incase we started with an async step.
  const onChainStep = { ...step, txRequest }
  const hash = yield* call(handleOnChainStep, { ...params, info, step: onChainStep, shouldWaitForConfirmation: false })

  yield* put(addPopup({ content: { type: PopupType.Transaction, hash }, key: hash }))
}

function* modifyLiquidity(params: LiquidityParams & { steps: TransactionStep[] }) {
  const {
    account,
    setCurrentStep,
    steps,
    liquidityTxContext: { action },
    onSuccess,
    onFailure,
  } = params

  let signature: string | undefined

  try {
    for (const step of steps) {
      switch (step.type) {
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
          yield* call(handlePositionTransactionStep, { account, step, setCurrentStep, action, signature })
          break
        default: {
          throw new Error('Unexpected step type')
        }
      }
    }
  } catch (e) {
    logger.error(e, { tags: { file: 'liquiditySaga', function: 'modifyLiquidity' } })
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
  type: TransactionStepType,
): IncreaseLiquidityTransactionInfo | DecreaseLiquidityTransactionInfo {
  const {
    currency0Amount: { currency: currency0, quotient: quotient0 },
    currency1Amount: { currency: currency1, quotient: quotient1 },
  } = action
  return {
    type:
      type === TransactionStepType.DecreasePositionTransaction
        ? TransactionType.DECREASE_LIQUIDITY
        : TransactionType.INCREASE_LIQUIDITY,
    token0CurrencyId: currencyId(currency0),
    token1CurrencyId: currencyId(currency1),
    token0CurrencyAmountRaw: quotient0.toString(),
    token1CurrencyAmountRaw: quotient1.toString(),
  }
}
