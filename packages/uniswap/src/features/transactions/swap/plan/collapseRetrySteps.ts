import { TradingApi } from '@universe/api'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'

function isErrorStep(step: TransactionAndPlanStep): boolean {
  return step.status === TradingApi.PlanStepStatus.STEP_ERROR
}

function isCompleteStep(step: TransactionAndPlanStep): boolean {
  return step.status === TradingApi.PlanStepStatus.COMPLETE
}

/**
 * Identity of a logical plan step across retries. After a step fails, the trading backend keeps
 * the failed rows "for visibility" and appends regenerated ones, so several rows can describe the
 * same logical step. `routingStepKey` (`type:tokenIn:tokenInChainId:tokenOut:tokenOutChainId`,
 * generated per routing step in ChainedOrderFactory) is copied unchanged onto regenerated steps,
 * so it is stable across replans — and a replan that changes the route produces a different key,
 * keeping genuinely distinct steps visible. The backend stamps the key only on order and batched
 * approval+swap steps, so pairing it with the transformed step type is defense-in-depth;
 * standalone approval rows carry no key (nor a tokenOut for the fallback) and are never
 * collapsed. Falls back to an equivalent route tuple when the key is missing; returns undefined
 * (never collapsed) otherwise.
 */
export function getLogicalStepKey(step: TransactionAndPlanStep): string | undefined {
  if (step.routingStepKey) {
    return `${step.type}:${step.routingStepKey}`
  }
  if (step.tokenIn && step.tokenOut && step.tokenInChainId !== undefined && step.tokenOutChainId !== undefined) {
    return `${step.type}:${step.stepType}:${step.tokenIn}:${step.tokenInChainId}:${step.tokenOut}:${step.tokenOutChainId}`
  }
  return undefined
}

/**
 * The failed row that currently blocks the plan, if any: the most recent STEP_ERROR row that has
 * not been recovered from. A failed row is stale once any later row is COMPLETE (its retry
 * succeeded). Position-independent, so failed rows trailing the actionable row are still found.
 */
export function findLatestActiveFailedStep(
  steps: readonly TransactionAndPlanStep[],
): TransactionAndPlanStep | undefined {
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i]
    if (!step) {
      continue
    }
    if (isCompleteStep(step)) {
      return undefined
    }
    if (isErrorStep(step)) {
      return step
    }
  }
  return undefined
}

/**
 * Collapses retry rows so each logical step renders once, in its latest meaningful state.
 * Display-only: the canonical plan array (saga, analytics, execution) is untouched.
 *
 * Per logical step with failed attempts:
 * - recovered (a COMPLETE row exists after the failures): failed rows are hidden
 * - retry in flight (`isSubmitting` with a live row): failed rows are hidden, the live row shows
 * - awaiting retry: only the latest failed row shows; older attempts and the regenerated
 *   not-yet-actionable duplicate are hidden
 *
 * Steps without failures, without a logical-step identity, or whose regenerated row describes a
 * different route (different key) are never hidden.
 */
export function collapseRetryStepsForDisplay({
  steps,
  isSubmitting,
}: {
  steps: TransactionAndPlanStep[]
  isSubmitting: boolean
}): TransactionAndPlanStep[] {
  const hidden = getHiddenRetrySteps({ steps, isSubmitting })
  return hidden.size === 0 ? steps : steps.filter((step) => !hidden.has(step))
}

function getHiddenRetrySteps({
  steps,
  isSubmitting,
}: {
  steps: TransactionAndPlanStep[]
  isSubmitting: boolean
}): Set<TransactionAndPlanStep> {
  const groups = new Map<string, TransactionAndPlanStep[]>()
  for (const step of steps) {
    const key = getLogicalStepKey(step)
    if (key === undefined) {
      continue
    }
    const group = groups.get(key)
    if (group) {
      group.push(step)
    } else {
      groups.set(key, [step])
    }
  }

  const hidden = new Set<TransactionAndPlanStep>()
  for (const rows of groups.values()) {
    let lastCompleteIndex = -1
    rows.forEach((row, index) => {
      if (isCompleteStep(row)) {
        lastCompleteIndex = index
      }
    })
    // Failed attempts before a COMPLETE row were recovered from — always stale.
    const staleErrors = rows.filter((row, index) => isErrorStep(row) && index < lastCompleteIndex)
    staleErrors.forEach((row) => hidden.add(row))

    const activeErrors = rows.filter((row, index) => isErrorStep(row) && index > lastCompleteIndex)
    if (activeErrors.length === 0) {
      continue
    }
    const latestError = activeErrors[activeErrors.length - 1]
    const liveRows = rows.filter((row) => !isErrorStep(row) && !isCompleteStep(row))

    if (isSubmitting && liveRows.length > 0) {
      activeErrors.forEach((row) => hidden.add(row))
    } else {
      activeErrors.forEach((row) => {
        if (row !== latestError) {
          hidden.add(row)
        }
      })
      liveRows.forEach((row) => hidden.add(row))
    }
  }
  return hidden
}

/**
 * Steps + current step as the swap review progress list should render them. Guarantees the
 * returned `displayStep` is present in `displaySteps` so status derivation stays coherent.
 */
export function getPlanStepsForDisplay({
  steps,
  currentStep,
  isSubmitting,
}: {
  steps: TransactionAndPlanStep[]
  currentStep: TransactionAndPlanStep
  isSubmitting: boolean
}): { displaySteps: TransactionAndPlanStep[]; displayStep: TransactionAndPlanStep } {
  const displaySteps = collapseRetryStepsForDisplay({ steps, isSubmitting })

  if (!isSubmitting) {
    // Highlight the failure that blocks the plan (semantic, not positional — failed rows may not
    // sit immediately before the actionable row).
    const failedStep = findLatestActiveFailedStep(steps)
    if (failedStep && displaySteps.includes(failedStep)) {
      return { displaySteps, displayStep: failedStep }
    }
  }

  if (displaySteps.includes(currentStep)) {
    return { displaySteps, displayStep: currentStep }
  }

  // currentStep was collapsed away (e.g. a stale failed row mid-retry) — fall back to its logical
  // step's visible row.
  const key = getLogicalStepKey(currentStep)
  const replacement = key ? displaySteps.find((step) => getLogicalStepKey(step) === key) : undefined
  return { displaySteps, displayStep: replacement ?? currentStep }
}
