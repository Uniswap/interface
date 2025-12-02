import { PlanStep, PlanStepStatus } from '@universe/api'
import { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'

/** Switches to the proper chain, if needed. If a chain switch is necessary and it fails, returns success=false. */
export async function handleSwitchChains(params: {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  swapTxContext: ValidatedSwapTxContext
}): Promise<{ chainSwitchFailed: boolean }> {
  const { selectChain, startChainId, swapTxContext } = params

  const swapChainId = swapTxContext.trade.inputAmount.currency.chainId

  if (isJupiter(swapTxContext) || swapChainId === startChainId) {
    return { chainSwitchFailed: false }
  }

  const chainSwitched = await selectChain(swapChainId)

  return { chainSwitchFailed: !chainSwitched }
}

export function stepHasFinalized(step: PlanStep): boolean {
  return step.status === PlanStepStatus.COMPLETE || step.status === PlanStepStatus.STEP_ERROR
}

export function findFirstActionableStep<T extends PlanStep | TransactionAndPlanStep>(steps: T[]): T | undefined {
  return steps.find((step) => step.status === PlanStepStatus.AWAITING_ACTION)
}

export function allStepsComplete(steps: PlanStep[]): boolean {
  return steps.every((step) => step.status === PlanStepStatus.COMPLETE)
}
