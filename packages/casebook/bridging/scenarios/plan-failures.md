# Bridging scenarios — Plan failure & safety paths

Failure and safety handling for cross-chain plans (bridge and chained-action swaps):
mid-plan step failure classification and price-change interrupts. These are the
incident-risk paths for a fund-moving area. Shared defaults: `_defaults.yaml`.

---
id: bridging-plan-step-failure-surfaces-error
title: Failed or unconfirmed plan step finalizes the plan with a visible error state
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts —
  final-step classification suite: Failed on last-step error, Pending (not Failed) when
  polling exhausts before confirmation, Canceled without an error toast on cancelled
  watch, and failure/proof data read by semantic step index after plan mutation.
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - crosschain
  - failure-path
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/planSaga.ts
  - packages/uniswap/src/features/transactions/swap/plan/planWatcherSaga.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts
    testName: plan saga — price change interrupts > final-step classification > calls onPlanFinalized with Failed when the watched last step errors
  - path: packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts
    testName: plan saga — price change interrupts > final-step classification > keeps the plan Pending (not Failed) when last-step polling exhausts before confirmation
  - path: packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts
    testName: plan saga — price change interrupts > final-step classification > finalizes as Canceled without an error toast when the last-step watch is cancelled
  - path: packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts
    testName: plan saga — price change interrupts > final-step classification > reads failure and proof data by semantic step index after plan mutation
---

> **urgent · all · unit · pr-check · automated** · chains: ethereum, arbitrum, base

**Given** a cross-chain plan (swap -> bridge -> swap) is executing and its watched last step errors, is cancelled, or exhausts polling before on-chain confirmation
**When** the plan watcher classifies the final step outcome
**Then** an errored last step finalizes the plan as Failed (surfacing an error state to the user, not silently stranding funds mid-plan), an exhausted poll keeps the plan Pending rather than falsely marking it Failed, a cancelled watch finalizes as Canceled without an error toast, and failure/proof data is read by semantic step index even after the plan response mutates

---
id: bridging-plan-price-change-interrupt
title: Price change beyond tolerance during plan execution interrupts for re-acceptance
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: >-
  (a) packages/uniswap/src/features/transactions/swap/plan/priceChangeDetection.test.ts
  — "plan price change detection" suite (interrupt on >1% drop, no interrupt within
  threshold or on improvement); (a) planSaga.test.ts — interrupts on initializePlan and
  between steps after watchPlanStep, and unlocks the execution lock on a price-change
  interrupt.
# scope
protocol_version: all
chains:
  - ethereum
  - arbitrum
  - base
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - bridging
  - crosschain
  - failure-path
  - slippage
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/plan/planSagaUtils.ts
  - packages/uniswap/src/features/transactions/swap/plan/planSaga.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/plan/priceChangeDetection.test.ts
    testName: plan price change detection > interrupts when expectedOutput drops more than 1%
  - path: packages/uniswap/src/features/transactions/swap/plan/priceChangeDetection.test.ts
    testName: plan price change detection > does not interrupt when drop is within 1% threshold
  - path: packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts
    testName: plan saga — price change interrupts > on initializePlan > interrupts when plan expectedOutput drops > 1% from original trade
  - path: packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts
    testName: plan saga — price change interrupts > after watchPlanStep > interrupts when refreshed plan price drops > 1% between steps
  - path: packages/uniswap/src/features/transactions/swap/plan/planSaga.test.ts
    testName: plan saga — price change interrupts > execution lock > unlocks on error (price change interrupt)
---

> **urgent · all · unit · pr-check · automated** · chains: ethereum, arbitrum, base

**Given** a cross-chain plan whose refreshed quote reports an expectedOutput more than 1% below the originally accepted trade (at plan initialization or between steps)
**When** price change detection compares the refreshed plan output against the accepted trade
**Then** plan execution is interrupted so the user must re-accept the new price before funds move, the execution lock is released on the interrupt, and a drop within the 1% threshold (or an improved output) does not interrupt the plan
