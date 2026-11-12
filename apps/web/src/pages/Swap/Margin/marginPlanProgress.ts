import { CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import type { GeneratedIcon } from '@universe/mycelium/icons'
import { ArrowBack } from '@universe/mycelium/icons/ArrowBack'
import { ArrowDown } from '@universe/mycelium/icons/ArrowDown'
import { ArrowUp } from '@universe/mycelium/icons/ArrowUp'
import { Check } from '@universe/mycelium/icons/Check'
import { Minus } from '@universe/mycelium/icons/Minus'
import { Plus } from '@universe/mycelium/icons/Plus'
import { X } from '@universe/mycelium/icons/X'
import type { TFunction } from 'i18next'
import type { MarginExecuteStep } from 'uniswap/src/components/ConfirmSwapModal/steps/MarginExecuteStepRow'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import type {
  MarginActionKey,
  MarginEip712StepPayload,
  MarginPlanResponse,
  MarginPlanStep,
  MarginPlanStepStatus,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import type { Permit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import type { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { WrapTransactionStep } from 'uniswap/src/features/transactions/steps/wrap'
import type { SwapTransactionStep } from 'uniswap/src/features/transactions/swap/steps/swap'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'
import { MARGIN_CHAIN_ID } from '~/constants/margin'

// The plan-step fields ProgressIndicator reads off a chained-action step: `status` for its failed-row
// check, `stepIndex` to tell rows apart, and the token/chain fields the swap plan row names.
type MarginProgressStepFields = {
  stepIndex: number
  status: TradingApi.PlanStepStatus
  tokenIn?: string
  tokenOut?: string
  tokenInChainId: number
  tokenOutChainId: number
}

// The swap step types whose rows margin reuses, plus its own position step.
type MarginDisplayStep =
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | Permit2SignatureStep
  | WrapTransactionStep
  | SwapTransactionStep
  | MarginExecuteStep

export type MarginProgressStep = MarginDisplayStep & MarginProgressStepFields

export interface MarginPlanProgress {
  steps: MarginProgressStep[]
  currentStep: { step: MarginProgressStep; accepted: boolean } | undefined
}

const STEP_STATUS: Record<MarginPlanStepStatus, TradingApi.PlanStepStatus> = {
  NOT_READY: TradingApi.PlanStepStatus.NOT_READY,
  AWAITING_ACTION: TradingApi.PlanStepStatus.AWAITING_ACTION,
  IN_PROGRESS: TradingApi.PlanStepStatus.IN_PROGRESS,
  COMPLETE: TradingApi.PlanStepStatus.COMPLETE,
  STEP_ERROR: TradingApi.PlanStepStatus.STEP_ERROR,
}

function adjustStepTitle({ action, t }: { action: MarginActionKey | undefined; t: TFunction }): string | undefined {
  switch (action) {
    case 'addEquity':
      return t('margin.plan.step.addMargin')
    case 'withdrawEquity':
      return t('margin.plan.step.withdrawMargin')
    case 'increaseLeverage':
      return t('margin.plan.step.increasePosition')
    case 'decreaseLeverage':
      return t('margin.plan.step.decreasePosition')
    default:
      return undefined
  }
}

// Static literal per step type — a template-interpolated key would get stripped by i18n:extract.
export function marginExecuteStepTitle({
  step,
  planAction,
  t,
}: {
  step: MarginPlanStep
  planAction: MarginActionKey | undefined
  t: TFunction
}): string | undefined {
  switch (step.stepType) {
    case 'MARGIN_OPEN':
      return t('margin.plan.step.open')
    case 'MARGIN_CLOSE':
      return t('margin.plan.step.close')
    case 'MARGIN_ADJUST':
      return adjustStepTitle({ action: planAction, t })
    // Reachable on the wire even though no client surface builds a recover plan: the server sweeps
    // funds parked at the account back to the wallet.
    case 'MARGIN_RECOVER':
      return t('margin.plan.step.recover')
    default:
      return undefined
  }
}

// Composite adjust actions have no row title, so they never reach this.
export function marginExecuteStepIcon({
  step,
  planAction,
}: {
  step: MarginPlanStep
  planAction: MarginActionKey | undefined
}): GeneratedIcon | undefined {
  switch (step.stepType) {
    case 'MARGIN_OPEN':
      return Check
    case 'MARGIN_CLOSE':
      return X
    case 'MARGIN_RECOVER':
      return ArrowBack
    case 'MARGIN_ADJUST':
      return adjustStepIcon(planAction)
    default:
      return undefined
  }
}

function adjustStepIcon(action: MarginActionKey | undefined): GeneratedIcon | undefined {
  switch (action) {
    case 'addEquity':
      return ArrowDown
    case 'withdrawEquity':
      return ArrowUp
    case 'increaseLeverage':
      return Plus
    case 'decreaseLeverage':
      return Minus
    default:
      return undefined
  }
}

// Display only: the rows read token, chain and amount fields, never the request. Margin's executor
// signs from the plan itself. A step that is not materialized yet (NOT_READY, empty payload) still
// needs a row, so it falls back to the contract the step is addressed to.
function displayTxRequest(step: MarginPlanStep, fallbackTo: string | undefined): ValidatedTransactionRequest {
  const payload = step.payload
  if ('to' in payload && 'chainId' in payload) {
    return { to: payload.to, data: payload.data, value: payload.value, chainId: payload.chainId }
  }
  return { to: fallbackTo ?? '', chainId: step.tokenInChainId ?? MARGIN_CHAIN_ID }
}

function isEip712Payload(payload: MarginPlanStep['payload']): payload is MarginEip712StepPayload {
  return 'domain' in payload && 'types' in payload && 'values' in payload
}

function toTransactionStep({
  step,
  planAction,
  t,
}: {
  step: MarginPlanStep
  planAction: MarginActionKey | undefined
  t: TFunction
}): MarginDisplayStep {
  const chainId = toSupportedChainId(step.tokenInChainId) ?? MARGIN_CHAIN_ID
  switch (step.stepType) {
    case 'APPROVAL_TXN':
    case 'RESET_APPROVAL_TXN': {
      const txRequest = displayTxRequest(step, step.tokenIn)
      const spender = txRequest.data ? parseERC20ApproveCalldata(txRequest.data.toString()).spender : ''
      return {
        // The approve-to-zero half of a USDT-style allowance gets the revocation row, so the pair does
        // not read as two identical "Approve USDT" rows.
        type:
          step.stepType === 'RESET_APPROVAL_TXN'
            ? TransactionStepType.TokenRevocationTransaction
            : TransactionStepType.TokenApprovalTransaction,
        txRequest,
        tokenAddress: step.tokenIn ?? '',
        chainId,
        amount: step.stepType === 'RESET_APPROVAL_TXN' ? '0' : (step.tokenInAmount ?? '0'),
        spender,
      }
    }
    case 'APPROVAL_PERMIT':
      return isEip712Payload(step.payload)
        ? { type: TransactionStepType.Permit2Signature, ...step.payload }
        : { type: TransactionStepType.Permit2Signature, domain: {}, types: {}, values: {} }
    case 'MARGIN_PRE_SWAP':
      if (step.wireStepType === TradingApi.PlanStepType.WRAP) {
        return {
          type: TransactionStepType.WrapTransaction,
          txRequest: displayTxRequest(step, step.tokenOut),
          amount: CurrencyAmount.fromRawAmount(nativeOnChain(chainId), step.tokenInAmount ?? '0'),
        }
      }
      return { type: TransactionStepType.SwapTransaction, txRequest: displayTxRequest(step, undefined) }
    case 'MARGIN_BRIDGE':
      return { type: TransactionStepType.SwapTransaction, txRequest: displayTxRequest(step, undefined) }
    default: {
      const marginStepTitle = marginExecuteStepTitle({ step, planAction, t })
      const txRequest = displayTxRequest(step, undefined)
      if (marginStepTitle === undefined) {
        return { type: TransactionStepType.SwapTransaction, txRequest }
      }
      const executeStep: MarginExecuteStep = {
        type: TransactionStepType.SwapTransaction,
        txRequest,
        stepType: TradingApi.PlanStepType.MARGIN_EXECUTE,
        marginStepTitle,
        marginStepIcon: marginExecuteStepIcon({ step, planAction }),
      }
      return executeStep
    }
  }
}

/**
 * The margin plan as the shared ProgressIndicator's steps plus the step it should highlight.
 *
 * ProgressIndicator reads a row's status off its position relative to `currentStep`, so the current
 * step carries what margin's own status rules decide:
 * - A failure this client minted (the wallet-funded open's pre-broadcast balance check) leaves the
 *   server step AWAITING_ACTION with no proof; it is marked STEP_ERROR here so the row is struck out.
 *   AWAITING_ACTION and no proof only: a step that broadcast is one the server is still verifying, and
 *   striking it would badge a live transaction as failed.
 * - Otherwise the first step not yet COMPLETE. It reads as in progress while the server works on it,
 *   materializes it (NOT_READY: the executor polls through it, nothing prompts) or holds its proof, and
 *   as awaiting the wallet while the prompt is open.
 */
export function marginPlanProgress({
  plan,
  failingStepIndex,
  isWalletPromptOpen,
  t,
}: {
  plan: MarginPlanResponse
  // From `resolveRestartSubject`, so the struck row and the restart note name the same step.
  failingStepIndex: number | undefined
  isWalletPromptOpen: boolean
  t: TFunction
}): MarginPlanProgress {
  const steps: MarginProgressStep[] = plan.steps.map((step) => {
    const isClientFailure = step.stepIndex === failingStepIndex && step.status === 'AWAITING_ACTION' && !step.proof
    return {
      ...toTransactionStep({ step, planAction: plan.action, t }),
      stepIndex: step.stepIndex,
      status: isClientFailure ? TradingApi.PlanStepStatus.STEP_ERROR : STEP_STATUS[step.status],
      tokenIn: step.tokenIn,
      tokenOut: step.tokenOut,
      // Supported chains only: the swap plan row resolves both through getChainInfo.
      tokenInChainId: toSupportedChainId(step.tokenInChainId) ?? MARGIN_CHAIN_ID,
      tokenOutChainId: toSupportedChainId(step.tokenOutChainId) ?? MARGIN_CHAIN_ID,
    }
  })

  const failed = steps.find((step) => step.status === TradingApi.PlanStepStatus.STEP_ERROR)
  if (failed) {
    return { steps, currentStep: { step: failed, accepted: false } }
  }
  const currentIndex = plan.steps.findIndex((step) => step.status !== 'COMPLETE')
  if (currentIndex === -1) {
    // Every step COMPLETE: the executor closes the sheet on completion, so this is only the last frame.
    const last = steps.at(-1)
    return { steps, currentStep: last ? { step: last, accepted: true } : undefined }
  }
  const current = steps[currentIndex]
  const currentPlanStep = plan.steps[currentIndex]
  const accepted =
    currentPlanStep.status === 'IN_PROGRESS' ||
    currentPlanStep.status === 'NOT_READY' ||
    (!isWalletPromptOpen && currentPlanStep.proof !== undefined)
  return { steps, currentStep: { step: current, accepted } }
}
