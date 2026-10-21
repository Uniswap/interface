import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { permit2Address } from '@uniswap/permit2-sdk'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { FetchError } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import type {
  MarginCreatePlanRequest,
  MarginEip712StepPayload,
  MarginPlanResponse,
  MarginPlanStep,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { MarginFormStoreContextProvider } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContextProvider'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestWeb3Provider } from '~/components/Web3Provider/TestWeb3Provider'
import { MARGIN_CHAIN_ID, MARGIN_ROUTER_ADDRESS } from '~/constants/margin'
import {
  decideOpenAction,
  decideProofReplay,
  decideReplayStall,
  isBridgePollExitStatus,
  isTerminalPatchError,
  isPlanForAccount,
  isRunSuperseded,
  isTerminalPlanStatus,
  isOpenCollateralBalanceInsufficient,
  isTerminalStepError,
  resolveOpenWalletPull,
  TERMINAL_STEP_ERROR_CODES,
} from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { marginPlanExecutionStore } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import {
  clearPersistedPlanId,
  getPersistedMarginPlanId,
  persistPlanId,
} from '~/pages/Swap/Margin/hooks/marginPlanPointer'
import {
  clearPlanProofs,
  clearStepProof,
  planHasProofForSteps,
  readStepProof,
  writeStepProof,
} from '~/pages/Swap/Margin/hooks/marginStepProofCache'
import { buildStepActivityInfo, useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import reduxStore from '~/state'

// Mocked wallet/network seam for the runLoop (mocked wallet/network) suite below — everything
// runLoop touches outside the pure guards/checks it composes (wagmi hooks, the Trading API, on-chain
// reads, signing). `mocks.liveAddress` is read by the wagmi/actions `getAccount` mock — flipping it
// mid-run simulates the imperative wallet state changing WITHOUT a React re-render, exactly the gap
// the live-account re-read closes. `mocks.reactAddress` backs the `useAccount()` hook mock and stays fixed per test.
const mocks = vi.hoisted(() => ({
  analytics: [] as Array<{ event: string; payload: Record<string, unknown> }>,
  reactAddress: undefined as string | undefined,
  liveAddress: undefined as string | undefined,
  getMarginPlan: vi.fn(),
  updateMarginPlan: vi.fn(),
  createMarginPlan: vi.fn(),
  cancelMarginPlan: vi.fn(),
  signTypedData: vi.fn(),
  selectChain: vi.fn(),
  getClient: vi.fn(),
  getConnectorClient: vi.fn(),
  balanceOf: vi.fn(),
  symbol: vi.fn(),
  sendTransaction: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/MarginApiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/MarginApiClient')>()
  return {
    ...actual,
    MarginApiClient: {
      ...actual.MarginApiClient,
      getMarginPlan: mocks.getMarginPlan,
      updateMarginPlan: mocks.updateMarginPlan,
      createMarginPlan: mocks.createMarginPlan,
      cancelMarginPlan: mocks.cancelMarginPlan,
    },
  }
})

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: (event: string, payload: Record<string, unknown>) => {
    mocks.analytics.push({ event, payload })
  },
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({
    address: mocks.reactAddress,
    status: mocks.reactAddress ? 'connected' : 'disconnected',
    chainId: MARGIN_CHAIN_ID,
    connector: undefined,
  }),
}))

vi.mock('~/hooks/useSelectChain', () => ({
  useSelectChain: () => mocks.selectChain,
}))

vi.mock('~/hooks/useEthersProvider', () => ({
  useEthersProvider: () => ({}),
  useEthersWeb3Provider: () => ({ getSigner: () => ({ sendTransaction: mocks.sendTransaction }) }),
  // Also the source-chain signer seam (getSignerForChain): a bridge/pre-swap on Base derives its
  // signer from the connector client, not the margin-chain walletProvider above.
  clientToProvider: (client: unknown) =>
    client ? { getSigner: () => ({ sendTransaction: mocks.sendTransaction }) } : undefined,
}))

vi.mock('~/chains', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/chains')>()
  return {
    ...actual,
    createContract: () => ({
      read: {
        balanceOf: mocks.balanceOf,
        symbol: mocks.symbol,
      },
    }),
    getAddress: (address: string) => address,
  }
})

vi.mock('~/utils/signing', () => ({
  signTypedData: mocks.signTypedData,
}))

vi.mock('wagmi/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi/actions')>()
  return {
    ...actual,
    getClient: (...args: unknown[]) => mocks.getClient(...args),
    getConnectorClient: (...args: unknown[]) => mocks.getConnectorClient(...args),
    getAccount: () => ({ address: mocks.liveAddress }),
  }
})

const SWAPPER_A = '0x00000000000000000000000000000000000000A1'
const SWAPPER_B = '0x00000000000000000000000000000000000000B2'

function fakePlan(overrides: Partial<MarginPlanResponse> = {}): MarginPlanResponse {
  return {
    requestId: 'req-1',
    planId: 'plan-1',
    swapper: SWAPPER_A,
    intent: 'OPEN',
    marketKey: 'mk',
    collateralToken: '0xcollateral',
    debtToken: '0xdebt',
    subId: '0',
    status: 'ACTIVE',
    currentStepIndex: 0,
    steps: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

// Loosely typed on purpose: plan create is quote-only now, and these fixtures only need to carry
// whatever a given test's assertions actually read (usually a marginQuote.swapConfig fragment) — not a
// fully-shaped MarginQuoteResponse. Force-cast at the boundary, same as ADJUST_REQUEST below.
function fakeCreateRequest(overrides: Record<string, unknown> = {}): MarginCreatePlanRequest {
  return {
    chainId: 1,
    swapper: SWAPPER_A,
    ...overrides,
  } as unknown as MarginCreatePlanRequest
}

// Full provider stack useExecuteMarginPlan needs to render: Redux (useTransactionAdderFromHash), React
// Query (invalidateQueries), wagmi (useAccount / useSelectChain / useEthers*Provider), and the margin
// form's own zustand context (setMarginFormState).
function renderExecuteMarginPlanHook(
  initialFormState: { activePlanId?: string; marginAmount: string } = { activePlanId: 'plan-1', marginAmount: '100' },
) {
  const queryClient = new QueryClient()
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  function wrapper({ children }: PropsWithChildren): JSX.Element {
    return (
      <Provider store={reduxStore}>
        <QueryClientProvider client={queryClient}>
          <TestWeb3Provider>
            <MarginFormStoreContextProvider initialState={initialFormState}>{children}</MarginFormStoreContextProvider>
          </TestWeb3Provider>
        </QueryClientProvider>
      </Provider>
    )
  }
  const { result } = renderHook(() => ({ exec: useExecuteMarginPlan(), form: useMarginFormStore((s) => s) }), {
    wrapper,
  })
  return { result, invalidateSpy }
}

function state(): ReturnType<(typeof marginPlanExecutionStore)['getState']> {
  return marginPlanExecutionStore.getState()
}
function actions(): ReturnType<(typeof marginPlanExecutionStore)['getState']>['actions'] {
  return state().actions
}

describe('marginPlanExecutionStore', () => {
  beforeEach(() => {
    actions().reset()
  })

  describe('single-flight lock', () => {
    it('acquires when idle and blocks a second acquire while held', () => {
      const first = actions().tryAcquireExecution({ planId: 'plan-1' })
      expect(first.acquired).toBe(true)
      expect(state().isExecuting).toBe(true)
      expect(state().executingPlanId).toBe('plan-1')

      const second = actions().tryAcquireExecution({ planId: 'plan-2' })
      expect(second.acquired).toBe(false)
      expect(state().executingPlanId).toBe('plan-1')
    })

    it('re-acquires after release', () => {
      const acquired = actions().tryAcquireExecution({ planId: 'plan-1' })
      expect(acquired.acquired).toBe(true)
      if (!acquired.acquired) {
        return
      }
      actions().releaseExecution({ epoch: acquired.epoch })
      expect(state().isExecuting).toBe(false)
      expect(state().executingPlanId).toBeUndefined()
      expect(actions().tryAcquireExecution({ planId: 'plan-2' }).acquired).toBe(true)
    })

    it('drops a stale-epoch release so a superseded loop cannot free a newer holder', () => {
      const stale = actions().tryAcquireExecution({ planId: 'plan-1' })
      expect(stale.acquired).toBe(true)
      if (!stale.acquired) {
        return
      }
      actions().reset() // bumps epoch + frees the lock (the abort)
      const fresh = actions().tryAcquireExecution({ planId: 'plan-2' })
      expect(fresh.acquired).toBe(true)

      actions().releaseExecution({ epoch: stale.epoch }) // the superseded loop's finally fires late
      expect(state().isExecuting).toBe(true)
      expect(state().executingPlanId).toBe('plan-2')
    })

    it('is not stranded when the create/persist region throws before the runLoop handoff', () => {
      // executePlan acquires (PENDING_CREATE) BEFORE the create POST. runLoop's finally never runs
      // when a throw happens between the acquire and the handoff, so that exit path releases here.
      const pending = actions().tryAcquireExecution({ planId: 'PENDING_CREATE' })
      expect(pending.acquired).toBe(true)
      if (!pending.acquired) {
        return
      }

      // Simulated create/persist/form failure → executePlan's catch releases the lock.
      actions().releaseExecution({ epoch: pending.epoch })

      // A later Open/resume/retry can acquire — the lock is free, not stranded on PENDING_CREATE.
      expect(state().executingPlanId).toBeUndefined()
      expect(actions().tryAcquireExecution({ planId: 'plan-1' }).acquired).toBe(true)
    })
  })

  describe('epoch-guarded writes', () => {
    it('applies setPlan / setStepError at the current epoch', () => {
      const epoch = actions().currentEpoch()
      const plan = fakePlan()
      actions().setPlan({ plan, epoch })
      expect(state().plan).toBe(plan)

      actions().setStepError({ error: { stepIndex: 1, code: 'X', message: 'boom' }, epoch })
      expect(state().stepError?.code).toBe('X')
    })

    it('drops setPlan / setStepError from a superseded epoch', () => {
      const staleEpoch = actions().currentEpoch()
      actions().reset() // epoch moves on

      actions().setPlan({ plan: fakePlan(), epoch: staleEpoch })
      expect(state().plan).toBeUndefined()

      actions().setStepError({ error: { stepIndex: 0, code: 'STALE', message: 'boom' }, epoch: staleEpoch })
      expect(state().stepError).toBeUndefined()
    })

    // The cross-generation case the store's own comment describes: wallet A's create POST resolving
    // after a confirmed switch to B must not wipe B's stash, which is B's only Retry.
    it('drops a setLastCreateRequest clear from a superseded epoch', () => {
      const staleEpoch = actions().currentEpoch()
      actions().reset() // epoch moves on
      const live = fakeCreateRequest({ swapper: SWAPPER_B })
      actions().setLastCreateRequest({ request: live, epoch: actions().currentEpoch() })

      actions().setLastCreateRequest({ request: undefined, epoch: staleEpoch })
      expect(state().lastCreateRequest).toBe(live)
    })
  })

  describe('resetForAccount', () => {
    it('clears plan + lock when the new address differs from plan.swapper', () => {
      const epoch = actions().currentEpoch()
      actions().setPlan({ plan: fakePlan({ swapper: SWAPPER_A }), epoch })
      actions().tryAcquireExecution({ planId: 'plan-1' })

      actions().resetForAccount({ address: SWAPPER_B })
      expect(state().plan).toBeUndefined()
      expect(state().executingPlanId).toBeUndefined()
      expect(state().isExecuting).toBe(false)
    })

    it('keeps the plan when the address still matches plan.swapper (case-insensitive)', () => {
      const epoch = actions().currentEpoch()
      const plan = fakePlan({ swapper: SWAPPER_A })
      actions().setPlan({ plan, epoch })

      actions().resetForAccount({ address: SWAPPER_A.toLowerCase() })
      expect(state().plan).toBe(plan)
    })

    it('keeps the plan on a transient disconnect (undefined address) so a wallet-lock blip does not abort it', () => {
      const epoch = actions().currentEpoch()
      const plan = fakePlan({ swapper: SWAPPER_A })
      actions().setPlan({ plan, epoch })

      actions().resetForAccount({ address: undefined })
      expect(state().plan).toBe(plan)
    })

    // A create-failure surface (lastCreateRequest + stepError + open
    // modal) has NO plan — the create POST failed before one was minted — so without the
    // lastCreateRequest fallback this early-returned on `!plan` and survived a wallet switch. Its
    // Retry would then re-mint/execute a plan for the OLD swapper under the NEW wallet.
    it('clears a create-failure surface (no plan, only lastCreateRequest) when the new address differs', () => {
      const epoch = actions().currentEpoch()
      actions().setLastCreateRequest({
        request: fakeCreateRequest({ swapper: SWAPPER_A }),
        epoch: actions().currentEpoch(),
      })
      actions().setStepError({ error: { stepIndex: 0, code: 'PLAN_CREATE_FAILED', message: 'boom' }, epoch })
      actions().setModalOpen(true)

      actions().resetForAccount({ address: SWAPPER_B })

      expect(state().lastCreateRequest).toBeUndefined()
      expect(state().stepError).toBeUndefined()
      expect(state().isModalOpen).toBe(false)
    })

    it('keeps a create-failure surface when the new address still matches lastCreateRequest.swapper', () => {
      const request = fakeCreateRequest({ swapper: SWAPPER_A })
      actions().setLastCreateRequest({ request, epoch: actions().currentEpoch() })

      actions().resetForAccount({ address: SWAPPER_A.toLowerCase() })

      expect(state().lastCreateRequest).toBe(request)
    })
  })

  describe('finalize supersession guard', () => {
    it('a zombie loop that captured an older epoch is detected as superseded vs the live run', () => {
      // Live loop L1 acquires and captures its epoch.
      const zombie = actions().tryAcquireExecution({ planId: 'plan-1' })
      expect(zombie.acquired).toBe(true)
      if (!zombie.acquired) {
        return
      }
      // Account switch aborts L1; a fresh run L2 acquires (each acquire bumps the epoch).
      actions().reset()
      actions().tryAcquireExecution({ planId: 'plan-2' })

      // L1 (now a zombie) later reaches COMPLETED and would call finalize — its guard must skip.
      expect(isRunSuperseded({ epoch: zombie.epoch, currentEpoch: actions().currentEpoch() })).toBe(true)
      // The live run's own epoch is NOT superseded, so its finalize proceeds.
      const liveEpoch = actions().currentEpoch()
      expect(isRunSuperseded({ epoch: liveEpoch, currentEpoch: actions().currentEpoch() })).toBe(false)
    })
  })

  describe('lastCreateRequest', () => {
    it('stashes the create request and clears it on reset, so a create-failure Retry re-runs it', () => {
      const request = { paymentAmount: '100' } as unknown as MarginCreatePlanRequest
      actions().setLastCreateRequest({ request, epoch: actions().currentEpoch() })
      expect(state().lastCreateRequest).toBe(request)

      actions().reset()
      expect(state().lastCreateRequest).toBeUndefined()
    })

    // Backstop: the modal's create-failure Retry gates on this exact boolean
    // (canRetryCreate) — isPlanForAccount reused with lastCreateRequest.swapper standing in for the
    // plan swapper. Even if resetForAccount somehow missed a stale request, Retry must never fire for
    // an account that no longer matches it.
    it('a stale lastCreateRequest.swapper no longer matches the connected account after a switch', () => {
      const request = fakeCreateRequest({ swapper: SWAPPER_A })
      expect(isPlanForAccount({ planSwapper: request.swapper, accountAddress: SWAPPER_A.toLowerCase() })).toBe(true)
      expect(isPlanForAccount({ planSwapper: request.swapper, accountAddress: SWAPPER_B })).toBe(false)
      expect(isPlanForAccount({ planSwapper: request.swapper, accountAddress: undefined })).toBe(false)
    })
  })

  describe('restart', () => {
    it('clears the persisted pointer + the whole store — the building blocks restartPlan composes', () => {
      const epoch = actions().currentEpoch()
      const plan = fakePlan({ swapper: SWAPPER_A })
      persistPlanId({ swapper: SWAPPER_A, planId: plan.planId, intent: 'OPEN' })
      actions().setPlan({ plan, epoch })
      actions().setStepError({
        error: { stepIndex: 0, code: 'PROOF_UNRECOVERABLE', message: 'unrecoverable' },
        epoch,
      })
      actions().setModalOpen(true)

      // restartPlan's exact sequence: clearPersistedPlanId(plan.swapper) then actions.reset().
      clearPersistedPlanId(plan.swapper)
      actions().reset()

      expect(getPersistedMarginPlanId(SWAPPER_A)).toBeUndefined()
      expect(state().plan).toBeUndefined()
      expect(state().stepError).toBeUndefined()
      expect(state().isModalOpen).toBe(false)
    })

    // The test above hand-composes restartPlan's building blocks, so a
    // regression INSIDE restartPlan itself (dropped pointer-clear / form-reset / positions-invalidation)
    // would stay green. This one calls the real hook's restartPlan().
    it('restartPlan() (hook-level): clears pointer, store, form state, and invalidates the positions query', () => {
      const epoch = actions().currentEpoch()
      const plan = fakePlan({ swapper: SWAPPER_A })
      persistPlanId({ swapper: SWAPPER_A, planId: plan.planId, intent: 'OPEN' })
      actions().setPlan({ plan, epoch })
      actions().setStepError({
        error: { stepIndex: 0, code: 'PROOF_UNRECOVERABLE', message: 'unrecoverable' },
        epoch,
      })
      actions().setModalOpen(true)

      const { result, invalidateSpy } = renderExecuteMarginPlanHook()

      act(() => {
        result.current.exec.restartPlan()
      })

      expect(getPersistedMarginPlanId(SWAPPER_A)).toBeUndefined()
      expect(state().plan).toBeUndefined()
      expect(state().stepError).toBeUndefined()
      expect(state().isModalOpen).toBe(false)
      expect(result.current.form.activePlanId).toBeUndefined()
      expect(result.current.form.marginAmount).toBe('')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.TradingApi, 'margin/positions'] })
    })

    // Whether the proofs go with the pointer depends on whether the failing step ever reached the
    // chain. Both directions matter, and they fail in opposite ways.
    // `proofStepIndex` matters as much as the code: a proof cached for the FAILING step is direct
    // evidence a tx exists for it, which outranks any promise the code makes about what was broadcast.
    // A proof on an EARLIER step is the ordinary case — that step completed and its tx landed.
    function restartWith(code: string, proofStepIndex = 1): { planId: string } {
      // restartPlan releases the reservation best-effort, so the client must return a thenable here.
      // Cleared per call: this describe does not reset mocks, so counts would carry across cases.
      mocks.cancelMarginPlan.mockReset().mockResolvedValue(undefined)
      const epoch = actions().currentEpoch()
      const plan = fakePlan({ swapper: SWAPPER_A })
      // fakePlan reuses one planId, and the cases that deliberately KEEP a proof would otherwise leave
      // it cached for the next case under the same key — making a later "nothing was broadcast" case
      // find evidence it never wrote.
      clearPlanProofs({ swapper: SWAPPER_A, planId: plan.planId })
      persistPlanId({ swapper: SWAPPER_A, planId: plan.planId, intent: 'OPEN' })
      writeStepProof({
        swapper: SWAPPER_A,
        planId: plan.planId,
        stepIndex: proofStepIndex,
        txHash: '0xdead',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x',
      })
      actions().setPlan({ plan, epoch })
      actions().setStepError({ error: { stepIndex: 0, code, message: 'm' }, epoch })

      const { result } = renderExecuteMarginPlanHook()
      act(() => {
        result.current.exec.restartPlan()
      })
      return { planId: plan.planId }
    }

    // Nothing was broadcast, so the orphaned proof would only withhold the pending card's Cancel and
    // leave the plan with no affordance until the cache TTL.
    it('restartPlan() clears the cached proofs when the failing step broadcast nothing', () => {
      const { planId } = restartWith('INSUFFICIENT_SOURCE_FUNDS')
      expect(readStepProof({ swapper: SWAPPER_A, planId, stepIndex: 1 })).toBeUndefined()
    })

    // Direct evidence outranks the code's promise. MAX_REMATERIALIZE_EXCEEDED guarantees nothing was
    // sent for the failing ATTEMPT, but a step that broadcast, took PROOF_REVERIFY_FAILED, was reset
    // and re-materialized until the budget ran out arrives holding a proof — a live deposit whose only
    // local record this would delete, and whose Cancel-suppression it would lift.
    it.each(['INSUFFICIENT_SOURCE_FUNDS', 'MAX_REMATERIALIZE_EXCEEDED'])(
      'restartPlan() KEEPS the proofs when the FAILING step holds one, even on %s',
      (code) => {
        const { planId } = restartWith(code, 0)
        expect(readStepProof({ swapper: SWAPPER_A, planId, stepIndex: 0 })).toBeDefined()
        // The reservation release rides the same predicate, for the same reason.
        expect(mocks.cancelMarginPlan).not.toHaveBeenCalled()
      },
    )

    // The opposite hazard: this tx WAS broadcast and may still land. Its proof withholds Cancel on a
    // plan with a possibly-live deposit, and is the only local record that a resume must replay
    // rather than re-broadcast — dropping it risks a second leveraged position.
    it('restartPlan() KEEPS the cached proofs when the failing step may have landed', () => {
      const { planId } = restartWith('PROOF_UNRECOVERABLE')
      expect(readStepProof({ swapper: SWAPPER_A, planId, stepIndex: 1 })).toBeDefined()
    })

    // The SERVER plan outlives a client-side terminal error — the balance guard mints one without the
    // server ever learning the step failed — so the subId stays reserved and the create this button
    // leads to would 409 until the TTL. Released on the same predicate as the proofs: a code whose tx
    // may have LANDED must not cancel a plan with a live deposit.
    it('restartPlan() releases the reservation only where nothing was broadcast', () => {
      restartWith('INSUFFICIENT_SOURCE_FUNDS')
      expect(mocks.cancelMarginPlan).toHaveBeenCalledTimes(1)

      restartWith('PROOF_UNRECOVERABLE')
      expect(mocks.cancelMarginPlan).not.toHaveBeenCalled()
    })
  })
})

describe('marginStepProofCache', () => {
  // The backup exists for the Safari-private/quota case, but a storage-wins merge cannot express a
  // DELETION: with setItem throwing, memory drops the proof while the stale stored copy survives and
  // wins, resurrecting it. The executor then re-decides 'reprompt' every iteration, each pass reporting
  // progress, so the stall counter never trips and the loop spins at GET speed without ever prompting.
  it('does not resurrect a cleared proof when localStorage rejects the write', () => {
    const planId = 'plan-proof-resurrect'
    writeStepProof({ swapper: SWAPPER_A, planId, stepIndex: 0, txHash: '0xdead', to: '0x01', data: '0x' })
    expect(readStepProof({ swapper: SWAPPER_A, planId, stepIndex: 0 })).toBeDefined()

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    // The failure is the point of the test, and the cache logs it by design.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      clearStepProof({ swapper: SWAPPER_A, planId, stepIndex: 0 })
    } finally {
      setItem.mockRestore()
      warn.mockRestore()
    }

    expect(readStepProof({ swapper: SWAPPER_A, planId, stepIndex: 0 })).toBeUndefined()
  })
})

describe('marginExecutionGuards', () => {
  describe('isPlanForAccount', () => {
    it('matches the plan swapper case-insensitively', () => {
      expect(isPlanForAccount({ planSwapper: SWAPPER_A, accountAddress: SWAPPER_A.toLowerCase() })).toBe(true)
    })

    it('rejects a different wallet', () => {
      expect(isPlanForAccount({ planSwapper: SWAPPER_A, accountAddress: SWAPPER_B })).toBe(false)
    })

    it('rejects a missing account (no wallet connected)', () => {
      expect(isPlanForAccount({ planSwapper: SWAPPER_A, accountAddress: undefined })).toBe(false)
    })
  })

  describe('decideOpenAction', () => {
    it('resumes an in-flight OPEN held in the store', () => {
      expect(decideOpenAction({ existing: { planId: 'p1', intent: 'OPEN', status: 'AWAITING_ACTION' } })).toEqual({
        kind: 'resume',
        planId: 'p1',
      })
    })

    it('blocks a fresh OPEN when a non-OPEN plan is in flight in the store', () => {
      expect(decideOpenAction({ existing: { planId: 'p2', intent: 'CLOSE', status: 'IN_PROGRESS' } })).toEqual({
        kind: 'block',
      })
    })

    it('creates when nothing is held', () => {
      expect(decideOpenAction({})).toEqual({ kind: 'create' })
    })

    it('creates when only a COMPLETED plan lingers in the store', () => {
      expect(decideOpenAction({ existing: { planId: 'p4', intent: 'OPEN', status: 'COMPLETED' } })).toEqual({
        kind: 'create',
      })
    })

    // The persisted pointer no longer drives the Open CTA — a stranded plan now surfaces as its own
    // card, and the CTA always opens what the form shows. (Was: persisted OPEN → resume, persisted
    // non-OPEN → block.) `persisted` is gone from the signature; a stray one is inert.
    it('ignores a persisted pointer — the CTA creates when the store is empty', () => {
      // @ts-expect-error persisted is no longer a parameter of decideOpenAction
      expect(decideOpenAction({ persisted: { planId: 'p9', intent: 'OPEN' } })).toEqual({ kind: 'create' })
    })
  })

  // Livelock guard for the dup-guard reconcile loop (FE-PLAN-DRY-2): a non-advancing replay/reconcile
  // must be stall-capped, not hot-spin GET+PATCH.
  describe('decideReplayStall', () => {
    it('resets the counter when the reconcile advanced the plan', () => {
      expect(decideReplayStall({ advanced: true, stalledPolls: 40, maxAttempts: 60 })).toEqual({
        stalledPolls: 0,
        action: 'reset',
      })
    })
    it('increments + stalls (sleep) when not advanced and under the cap', () => {
      expect(decideReplayStall({ advanced: false, stalledPolls: 0, maxAttempts: 60 })).toEqual({
        stalledPolls: 1,
        action: 'stall',
      })
      expect(decideReplayStall({ advanced: false, stalledPolls: 59, maxAttempts: 60 })).toEqual({
        stalledPolls: 60,
        action: 'stall',
      })
    })
    it('bails to CLIENT_ERROR once the incremented count exceeds the cap', () => {
      expect(decideReplayStall({ advanced: false, stalledPolls: 60, maxAttempts: 60 })).toEqual({
        stalledPolls: 61,
        action: 'bail',
      })
    })
  })

  // Both of these decide a FAIL DIRECTION on the executor's error paths and had no coverage at all.
  describe('isTerminalPatchError', () => {
    const patchError = (status: number): FetchError => new FetchError({ response: { status } as Response })

    // A 4xx means the proof is invalid or the step already advanced — replaying cannot help. Only a
    // transient 5xx / network failure is retried, because the BE PATCH is idempotent on identical proofs.
    it.each([400, 401, 404, 409, 422, 499])('treats %i as terminal — retrying cannot help', (status) => {
      expect(isTerminalPatchError(patchError(status))).toBe(true)
    })

    it.each([500, 502, 503])('treats %i as retryable', (status) => {
      expect(isTerminalPatchError(patchError(status))).toBe(false)
    })

    // A network failure is not a FetchError at all and must stay retryable.
    it.each([new Error('network down'), undefined, null, 'not-an-error'])(
      'treats a non-FetchError (%p) as retryable',
      (error) => {
        expect(isTerminalPatchError(error)).toBe(false)
      },
    )
  })

  describe('isBridgePollExitStatus', () => {
    // Only an actively-filling deposit keeps the poll running. Every other status must exit, including
    // a server-side auto-reset back to AWAITING_ACTION / NOT_READY — otherwise the poll blind-stalls up
    // to the ~6h fillDeadline instead of letting runLoop re-prompt.
    it('keeps polling only while the deposit is still filling', () => {
      expect(isBridgePollExitStatus('IN_PROGRESS')).toBe(false)
    })

    it.each(['COMPLETE', 'STEP_ERROR', 'AWAITING_ACTION', 'NOT_READY'] as const)('exits on %s', (status) => {
      expect(isBridgePollExitStatus(status)).toBe(true)
    })
  })

  // The double-deposit fail-safe: a false 'reprompt' re-broadcasts a deposit that already landed, so
  // every ambiguous input must stay 'replay'. Nothing pinned this before.
  describe('decideProofReplay', () => {
    const STORED = { to: '0x00000000000000000000000000000000000000A1', data: '0xABCDEF' }
    const awaiting = (payload: Record<string, unknown>): MarginPlanStep =>
      ({ ...marginAdjustStep(), status: 'AWAITING_ACTION', payload }) as MarginPlanStep

    it('advances when the server already consumed the proof', () => {
      expect(decideProofReplay({ stored: STORED, freshStep: undefined })).toBe('advance')
      expect(decideProofReplay({ stored: STORED, freshStep: { ...marginAdjustStep(), status: 'COMPLETE' } })).toBe(
        'advance',
      )
    })

    it('replays an unchanged step — the PATCH never landed', () => {
      expect(decideProofReplay({ stored: STORED, freshStep: awaiting({ to: STORED.to, data: STORED.data }) })).toBe(
        'replay',
      )
    })

    // Normalization only ever moves a borderline case TOWARD replay: a formatting-only difference from
    // the backend must never read as a re-materialization.
    it('replays through case differences in both the target and the calldata', () => {
      expect(
        decideProofReplay({
          stored: STORED,
          freshStep: awaiting({ to: STORED.to.toLowerCase(), data: STORED.data.toLowerCase() }),
        }),
      ).toBe('replay')
    })

    it.each([
      ['no target on the fresh step', { data: STORED.data }],
      ['no calldata on the fresh step', { to: STORED.to }],
      ['an empty payload', {}],
    ])('replays rather than re-broadcasting when the payload is incomplete (%s)', (_label, payload) => {
      expect(decideProofReplay({ stored: STORED, freshStep: awaiting(payload) })).toBe('replay')
    })

    it.each([
      ['no stored target', { to: '', data: STORED.data }],
      ['no stored calldata', { to: STORED.to, data: '' }],
    ])('replays when the STORED proof is incomplete (%s)', (_label, stored) => {
      expect(decideProofReplay({ stored, freshStep: awaiting({ to: STORED.to, data: STORED.data }) })).toBe('replay')
    })

    // The one case that may re-broadcast: a positively different target or calldata means the server
    // re-materialized the step and the cached hash is dead.
    it('reprompts only on a positive calldata change', () => {
      expect(decideProofReplay({ stored: STORED, freshStep: awaiting({ to: STORED.to, data: '0xFEED' }) })).toBe(
        'reprompt',
      )
      expect(
        decideProofReplay({
          stored: STORED,
          freshStep: awaiting({ to: '0x00000000000000000000000000000000000000B2', data: STORED.data }),
        }),
      ).toBe('reprompt')
    })
  })

  // This membership is the sole source of truth for the modal's Restart-vs-Retry branch —
  // a terminal code MUST render Restart (never a no-op/dangerous Retry).
  describe('isTerminalStepError', () => {
    it('is terminal for the four wire codes, plus the client-minted PLAN_TERMINAL', () => {
      // A readonly tuple now, not a Set: the restart-note switch is typed as a union over it, so the
      // membership list and the switch cannot drift into two independent lists of the same codes.
      expect([...TERMINAL_STEP_ERROR_CODES]).toEqual([
        'SOURCE_STEP_UNRECOVERABLE',
        'INSUFFICIENT_SOURCE_FUNDS',
        'PROOF_UNRECOVERABLE',
        'MAX_REMATERIALIZE_EXCEEDED',
        // Not a wire code: minted when a plan reaches a terminal STATUS with no failing step (a
        // CANCELLED plan carries none), so the modal offers Restart rather than a no-op Retry.
        'PLAN_TERMINAL',
      ])
      expect(isTerminalStepError('SOURCE_STEP_UNRECOVERABLE')).toBe(true)
      expect(isTerminalStepError('INSUFFICIENT_SOURCE_FUNDS')).toBe(true)
      expect(isTerminalStepError('PROOF_UNRECOVERABLE')).toBe(true)
      expect(isTerminalStepError('MAX_REMATERIALIZE_EXCEEDED')).toBe(true)
      expect(isTerminalStepError('PLAN_TERMINAL')).toBe(true)
    })

    it('is NOT terminal for PROOF_REVERIFY_FAILED — retryable by design (bridge-only, depositId interlock)', () => {
      expect(isTerminalStepError('PROOF_REVERIFY_FAILED')).toBe(false)
    })

    // Regression guard: TX_STUCK_TIMEOUT resets the step and re-materializes fresh calldata server-side —
    // it must stay on the normal Retry path, never Restart.
    it('is NOT terminal for TX_STUCK_TIMEOUT — server rebuilds the step, retry is safe', () => {
      expect(isTerminalStepError('TX_STUCK_TIMEOUT')).toBe(false)
    })

    it('is not terminal for an ordinary/unknown step error code', () => {
      expect(isTerminalStepError('CLIENT_ERROR')).toBe(false)
      expect(isTerminalStepError('PRICE_DRIFT')).toBe(false)
    })
  })

  // The pull the OPEN will take out of the wallet, resolved WITHOUT decoding the open's own calldata
  // (a nested router struct the client carries no ABI for) and without trusting the step's amount
  // field on its own.
  describe('resolveOpenWalletPull', () => {
    const routerPermit = (values: Record<string, unknown>): MarginPlanStep => ({
      stepIndex: 0,
      stepType: 'APPROVAL_PERMIT',
      method: 'SIGN_MSG',
      payloadType: 'EIP_712',
      payload: { domain: { chainId: MARGIN_CHAIN_ID, verifyingContract: PERMIT2 }, types: {}, values },
      status: 'COMPLETE',
    })
    const open = (overrides: Partial<MarginPlanStep> = {}): MarginPlanStep => ({
      stepIndex: 1,
      stepType: 'MARGIN_OPEN',
      method: 'SEND_TX',
      payloadType: 'TX',
      tokenIn: BASE_USDC,
      payload: { to: MARGIN_ROUTER_ADDRESS, data: '0x', chainId: MARGIN_CHAIN_ID },
      status: 'AWAITING_ACTION',
      ...overrides,
    })

    it('prices the pull off the collateral permit this client signed', () => {
      const permit = routerPermit({
        details: { token: BASE_USDC, amount: '1000' },
        spender: MARGIN_ROUTER_ADDRESS,
      })
      expect(resolveOpenWalletPull({ plan: { steps: [permit, open()] }, step: open() })).toEqual({
        kind: 'amount',
        token: BASE_USDC,
        amount: 1000n,
      })
    })

    // Permit2 caps the pull at the SIGNED figure on-chain, so it outranks anything the wire restates.
    it('prefers the step tokenInAmount over the permit ceiling', () => {
      const permit = routerPermit({
        details: { token: BASE_USDC, amount: '1000' },
        spender: MARGIN_ROUTER_ADDRESS,
      })
      const step = open({ tokenInAmount: '1' })
      expect(resolveOpenWalletPull({ plan: { steps: [permit, step] }, step })).toMatchObject({ amount: 1n })
    })

    // The backend sends '0' where the client expects absence. Taken literally it makes the balance
    // check `balance < 0n` — never true — so the guard silently stops guarding.
    it("treats a '0' tokenInAmount as no figure, not as a zero pull", () => {
      const stepOnly = open({ tokenInAmount: '0' })
      expect(resolveOpenWalletPull({ plan: { steps: [stepOnly] }, step: stepOnly })).toEqual({
        kind: 'unpriced',
        token: BASE_USDC,
      })

      const permit = routerPermit({ details: { token: BASE_USDC, amount: '750' }, spender: MARGIN_ROUTER_ADDRESS })
      const withPermit = open({ tokenInAmount: '0' })
      expect(resolveOpenWalletPull({ plan: { steps: [permit, withPermit] }, step: withPermit })).toMatchObject({
        amount: 750n,
      })
    })

    // The backend signs collateral permits for the AllowanceTransfer cap so an equity resize stays
    // covered. Read as a pull it would exceed every real balance and fail every open closed.
    it('never reads a MaxUint160 permit as a pull figure', () => {
      const permit = routerPermit({
        details: { token: BASE_USDC, amount: ((1n << 160n) - 1n).toString() },
        spender: MARGIN_ROUTER_ADDRESS,
      })
      const step = open({})
      expect(resolveOpenWalletPull({ plan: { steps: [permit, step] }, step })).toEqual({
        kind: 'unpriced',
        token: BASE_USDC,
      })
    })

    it('falls back to tokenInAmount when no collateral permit exists (direct-payment open)', () => {
      const step = open({ tokenInAmount: '250' })
      expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).toEqual({
        kind: 'amount',
        token: BASE_USDC,
        amount: 250n,
      })
    })

    it('ignores a Universal Router payment permit — it is already spent by the pre-swap', () => {
      const payment = routerPermit({ details: { token: BASE_USDC, amount: '1000' }, spender: UNIVERSAL_ROUTER })
      expect(resolveOpenWalletPull({ plan: { steps: [payment, open()] }, step: open() })).toEqual({
        kind: 'unpriced',
        token: BASE_USDC,
      })
    })

    it('ignores a router permit for a DIFFERENT token', () => {
      const other = routerPermit({ details: { token: WETH, amount: '1000' }, spender: MARGIN_ROUTER_ADDRESS })
      expect(resolveOpenWalletPull({ plan: { steps: [other, open()] }, step: open() })).toMatchObject({
        kind: 'unpriced',
      })
    })

    it('reports native for a msg.value-funded open', () => {
      const step = open({ tokenIn: MARGIN_NATIVE_TOKEN_ADDRESS })
      expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).toEqual({ kind: 'native' })
    })

    it('never throws on a malformed amount — it degrades to unpriced', () => {
      const permit = routerPermit({
        details: { token: BASE_USDC, amount: 'not-a-number' },
        spender: MARGIN_ROUTER_ADDRESS,
      })
      expect(resolveOpenWalletPull({ plan: { steps: [permit, open()] }, step: open() })).toMatchObject({
        kind: 'unpriced',
      })
    })
  })

  describe('isOpenCollateralBalanceInsufficient', () => {
    it('blocks a priced pull the balance cannot cover, and admits an exact cover', () => {
      const pull = { kind: 'amount', token: BASE_USDC, amount: 1000n } as const
      expect(isOpenCollateralBalanceInsufficient({ balance: 999n, pull })).toBe(true)
      expect(isOpenCollateralBalanceInsufficient({ balance: 1000n, pull })).toBe(false)
    })

    // No figure to compare, but an EMPTY wallet provably cannot fund ANY pull.
    it('blocks an unpriced pull only against an empty wallet', () => {
      const pull = { kind: 'unpriced', token: BASE_USDC } as const
      expect(isOpenCollateralBalanceInsufficient({ balance: 0n, pull })).toBe(true)
      expect(isOpenCollateralBalanceInsufficient({ balance: 1n, pull })).toBe(false)
    })

    it('never blocks a native-funded open — the wallet refuses an underfunded msg.value itself', () => {
      expect(isOpenCollateralBalanceInsufficient({ balance: 0n, pull: { kind: 'native' } })).toBe(false)
    })
  })

  // The executor loop's own terminal set — a resumed CANCELLED plan must stop the loop, not spin
  // toward a generic "Plan stalled" error or re-prompt a residual AWAITING_ACTION step.
  describe('isTerminalPlanStatus', () => {
    it('is terminal for COMPLETED, FAILED, and CANCELLED', () => {
      expect(isTerminalPlanStatus('COMPLETED')).toBe(true)
      expect(isTerminalPlanStatus('FAILED')).toBe(true)
      expect(isTerminalPlanStatus('CANCELLED')).toBe(true)
    })

    it('is NOT terminal for ACTIVE, AWAITING_ACTION, or IN_PROGRESS — the loop keeps driving these', () => {
      expect(isTerminalPlanStatus('ACTIVE')).toBe(false)
      expect(isTerminalPlanStatus('AWAITING_ACTION')).toBe(false)
      expect(isTerminalPlanStatus('IN_PROGRESS')).toBe(false)
    })
  })
})

const PERMIT2 = permit2Address(MARGIN_CHAIN_ID)
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
// The v4-capable router every pre-swap routes through. Named here only so a payment permit's spender
// is realistic — the client does not constrain it (see the permit fixture below).
const UNIVERSAL_ROUTER = UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, MARGIN_CHAIN_ID)
const WETH = getWrappedNativeAddress(MARGIN_CHAIN_ID) as string

// A PermitSingle to sign. `values.spender` is read only to SIZE the pre-broadcast balance check — the
// client does not constrain it, and forwards server-composed permits and calldata verbatim, on the
// same trust model as the shipped non-margin plan flow.
function permitStep(overrides: Partial<MarginPlanStep> = {}): MarginPlanStep {
  return {
    stepIndex: 0,
    stepType: 'APPROVAL_PERMIT',
    method: 'SIGN_MSG',
    payloadType: 'EIP_712',
    payload: {
      domain: { name: 'Permit2', chainId: MARGIN_CHAIN_ID, verifyingContract: PERMIT2 },
      types: { PermitSingle: [] },
      values: {
        details: { token: BASE_USDC, amount: '1000', expiration: '0', nonce: '0' },
        spender: UNIVERSAL_ROUTER,
        sigDeadline: '0',
      },
    },
    status: 'AWAITING_ACTION',
    ...overrides,
  }
}

// `permitStep`'s EIP-712 payload with just the fields a test bends.
function permitPayload(
  overrides: { spender?: string; chainId?: number; token?: string; amount?: string } = {},
): MarginPlanStep['payload'] {
  const base = permitStep().payload as MarginEip712StepPayload
  const details = base.values.details as Record<string, string>
  return {
    ...base,
    domain: { ...base.domain, chainId: overrides.chainId ?? base.domain.chainId },
    values: {
      ...base.values,
      details: { ...details, token: overrides.token ?? details.token, amount: overrides.amount ?? details.amount },
      spender: overrides.spender ?? UNIVERSAL_ROUTER,
    },
  }
}

function marginPlan(overrides: Partial<MarginPlanResponse> = {}): MarginPlanResponse {
  return fakePlan(overrides)
}

// A router-bound position step. Its calldata is opaque to the client now — the server composes and
// hardens it — so the fixture carries only the target, which nothing client-side validates.
function marginAdjustStep(overrides: Partial<MarginPlanStep> = {}): MarginPlanStep {
  return {
    stepIndex: 0,
    stepType: 'MARGIN_ADJUST',
    method: 'SEND_TX',
    payloadType: 'TX',
    payload: { to: MARGIN_ROUTER_ADDRESS, data: '0xdeadbeef', chainId: MARGIN_CHAIN_ID },
    status: 'AWAITING_ACTION',
    ...overrides,
  }
}

// runLoop (mocked wallet/network): everything else in this file tests the pure store/guards/pointer
// helpers runLoop composes. These drive the REAL hook end-to-end (resumePlan → runLoop) with the
// wallet/network seam mocked (see the vi.mock calls above), to prove the guards are actually WIRED
// into the loop — not just correct in isolation.
describe('runLoop (mocked wallet/network)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // The pointer lives in localStorage, which persists across cases in this file — a pointer left by
    // an earlier test would otherwise be displaced by a later one and trip the displacement warning.
    localStorage.clear()
    marginPlanExecutionStore.getState().actions.reset()
    mocks.analytics.length = 0
    mocks.reactAddress = SWAPPER_A
    mocks.liveAddress = SWAPPER_A
    mocks.getClient.mockReturnValue({})
    mocks.getConnectorClient.mockResolvedValue({})
    mocks.signTypedData.mockResolvedValue('0xsignature')
    mocks.selectChain.mockResolvedValue(true)
    mocks.symbol.mockResolvedValue('USDC')
    mocks.sendTransaction.mockResolvedValue({ hash: '0xtxhash' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Fund-safety: a mid-flight account switch must abort the loop BEFORE the next
  // step reaches the wallet — reusing isRunSuperseded / isPlanForAccount, re-checked every iteration.
  describe('mid-flight account switch aborts the loop', () => {
    it('bails before signing step 1 when the epoch is superseded between steps', async () => {
      let currentPlan = marginPlan({
        planId: 'plan-fix1-epoch',
        status: 'AWAITING_ACTION',
        steps: [permitStep({ stepIndex: 0 }), permitStep({ stepIndex: 1 })],
      })
      mocks.getMarginPlan.mockImplementation(async () => currentPlan)
      mocks.updateMarginPlan.mockImplementation(async ({ steps }: { steps: Array<{ stepIndex: number }> }) => {
        const stepIndex = steps[0].stepIndex
        currentPlan = {
          ...currentPlan,
          steps: currentPlan.steps.map((s) => (s.stepIndex === stepIndex ? { ...s, status: 'COMPLETE' } : s)),
        }
        if (stepIndex === 0) {
          // resetForAccount would bump the epoch here in production (confirmed account switch) —
          // simulate it directly so the already-running loop's NEXT iteration sees it superseded.
          marginPlanExecutionStore.getState().actions.reset()
        }
        return currentPlan
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-fix1-epoch' })
      })

      // Only step 0 ever reached the wallet — the guard bailed before step 1 could broadcast.
      expect(mocks.signTypedData).toHaveBeenCalledTimes(1)
    })

    // The create-time supersession guard is the ONE exit from the lock-guarded region that isn't a
    // throw, so it needs its own release. `isSuperseded` is also true for a transient UNDEFINED
    // address (wallet lock / provider reconnect), and resetForAccount deliberately ignores that case —
    // so if this branch leaks the lock, nothing ever frees it and every later Open/resume/retry
    // silently bails at `!acquired`.
    it('releases the execution lock when the address blips undefined during the create POST', async () => {
      const created = marginPlan({ planId: 'plan-create-blip', status: 'AWAITING_ACTION', steps: [] })
      mocks.createMarginPlan.mockImplementation(async () => {
        mocks.liveAddress = undefined
        return created
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.executePlan({ request: fakeCreateRequest() })
      })

      expect(state().isExecuting).toBe(false)
      expect(state().executingPlanId).toBeUndefined()
    })

    // A throw AFTER the POST resolves leaves a plan already minted and holding its subId. Leaving the
    // create stashed arms canRetryCreate, whose Retry re-POSTs the identical request — a second plan
    // and subId, and the re-persist overwrites the first plan's only resume pointer.
    it('drops the create stash when the throw lands after the plan was already minted', async () => {
      const created = marginPlan({ planId: 'plan-minted-then-throw', status: 'AWAITING_ACTION', steps: [] })
      // The very next statement after the POST reads plan.swapper, so this throws with planMinted set.
      mocks.createMarginPlan.mockResolvedValue(
        Object.defineProperty({ ...created }, 'swapper', {
          get(): string {
            throw new Error('persist failed')
          },
        }),
      )

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.executePlan({ request: fakeCreateRequest() })
      })

      expect(state().lastCreateRequest).toBeUndefined()
      expect(state().stepError?.code).toBe('PLAN_CREATE_FAILED')
    })

    // The loop's swapper guard reads the COMMITTED render, which can point at a different wallet than
    // wagmi's live state — so it fires where the create-time supersession check (live) did not. It exits
    // before `setPlan`, so the modal lands on the create-failure surface, and a stash left behind there
    // arms a Retry that re-POSTs a request whose plan is already minted and holding its subId.
    it('drops the create stash when the committed render points at another wallet', async () => {
      const created = marginPlan({ planId: 'plan-render-mismatch', status: 'AWAITING_ACTION', steps: [] })
      mocks.createMarginPlan.mockResolvedValue({ ...created, swapper: SWAPPER_A })
      // Live stays A, so nothing upstream of the guard aborts; only the render disagrees.
      mocks.reactAddress = SWAPPER_B

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.executePlan({ request: fakeCreateRequest() })
      })

      expect(state().plan).toBeUndefined()
      expect(state().stepError).toBeDefined()
      expect(state().lastCreateRequest).toBeUndefined()
    })

    // The stash and the quoted action key are stamped together but have different lifetimes: a retry
    // (retryCurrentStep → resumePlan) drops the stash the moment it takes over the surface, mid-run,
    // while every REMAINING step still has to report what the run was quoted under. Reading the key
    // off the stash makes the rest of a retried run report `action: undefined`.
    it('keeps naming the quoted action for the rest of a run whose stash was dropped', async () => {
      let currentPlan = marginPlan({
        planId: 'plan-quoted-action',
        status: 'AWAITING_ACTION',
        steps: [marginAdjustStep({ stepIndex: 0 }), marginAdjustStep({ stepIndex: 1 })],
      })
      mocks.createMarginPlan.mockResolvedValue(currentPlan)
      mocks.getMarginPlan.mockImplementation(async () => currentPlan)
      mocks.updateMarginPlan.mockImplementation(async ({ steps }: { steps: Array<{ stepIndex: number }> }) => {
        const stepIndex = steps[0].stepIndex
        if (stepIndex === 0) {
          // Exactly what a retry does on its way back in.
          actions().setLastCreateRequest({ request: undefined, epoch: state().epoch })
        }
        currentPlan = {
          ...currentPlan,
          status: stepIndex === 1 ? 'COMPLETED' : currentPlan.status,
          steps: currentPlan.steps.map((s) => (s.stepIndex === stepIndex ? { ...s, status: 'COMPLETE' } : s)),
        }
        return currentPlan
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.executePlan({
          request: fakeCreateRequest({ marginQuote: { action: 'addEquity', legs: [] } }),
        })
      })

      const completions = mocks.analytics.filter((e) => e.event === InterfaceEventName.MarginPlanStepCompleted)
      expect(completions.length).toBeGreaterThan(1)
      expect(state().lastCreateRequest).toBeUndefined()
      expect(completions.every((e) => e.payload.action === 'addEquity')).toBe(true)
    })

    // The other half of the quoted key's lifetime: it must survive a RETRY of its own plan, and must
    // NOT follow a handoff to a different plan — the pointer banner can resume one this session never
    // quoted, and stamping it with the previous run's action key silently mislabels its analytics.
    it('drops the quoted action when a resume picks up a plan this session never quoted', async () => {
      actions().setLastCreateRequest({
        request: fakeCreateRequest({ marginQuote: { action: 'addEquity', legs: [] } }),
        epoch: state().epoch,
      })
      expect(state().lastQuotedAction).toBe('addEquity')

      // CANCELLED so the loop is terminal on entry — the clear under test happens before the GET, so
      // the plan's status is irrelevant to it and a live status would just poll forever.
      const foreign = marginPlan({ planId: 'plan-someone-elses', status: 'CANCELLED', steps: [] })
      mocks.getMarginPlan.mockResolvedValue(foreign)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-someone-elses' })
      })

      expect(state().lastQuotedAction).toBeUndefined()
    })

    // The clear sits under the same lock gate as every other write in resumePlan. Mid-create the pointer
    // banner is eligible while `plan` is still undefined, so an unguarded clear would wipe the key the
    // live run had just stamped and report `action: undefined` for the rest of ITS steps.
    it('leaves the quoted action alone when the lock rejects the resume', async () => {
      actions().setLastCreateRequest({
        request: fakeCreateRequest({ marginQuote: { action: 'addEquity', legs: [] } }),
        epoch: state().epoch,
      })
      // A live run owns the lock under a DIFFERENT plan id — exactly the mid-create shape.
      expect(actions().tryAcquireExecution({ planId: 'PENDING_CREATE' }).acquired).toBe(true)
      mocks.getMarginPlan.mockResolvedValue(
        marginPlan({ planId: 'plan-someone-elses', status: 'CANCELLED', steps: [] }),
      )

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-someone-elses' })
      })

      expect(state().lastQuotedAction).toBe('addEquity')
    })

    // Wallets validate a typed-data permit's domain.chainId against the ACTIVE chain. On a bridge-funded
    // open the source-chain legs leave the wallet elsewhere, so a margin-chain permit prompted without a
    // switch is rejected outright — and Retry re-enters the same state, because retrying moves nothing.
    it('switches to the permit chain before prompting a SIGN_MSG, not only a SEND_TX', async () => {
      let currentPlan = marginPlan({
        planId: 'plan-permit-chain',
        status: 'AWAITING_ACTION',
        steps: [permitStep({ stepIndex: 0 })],
      })
      mocks.getMarginPlan.mockImplementation(async () => currentPlan)
      // The PATCH takes the plan terminal so the loop exits after the one step under test.
      mocks.updateMarginPlan.mockImplementation(async () => {
        currentPlan = {
          ...currentPlan,
          status: 'COMPLETED',
          steps: currentPlan.steps.map((step) => ({ ...step, status: 'COMPLETE' })),
        }
        return currentPlan
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-permit-chain' })
      })

      expect(mocks.selectChain).toHaveBeenCalledWith(MARGIN_CHAIN_ID)
      expect(mocks.signTypedData).toHaveBeenCalled()
    })

    // A refused switch parks the step exactly like a rejected signature — never prompts anyway.
    it('parks the SIGN_MSG rather than prompting when the wallet refuses the switch', async () => {
      const plan = marginPlan({
        planId: 'plan-permit-refused',
        status: 'AWAITING_ACTION',
        steps: [permitStep({ stepIndex: 0 })],
      })
      mocks.getMarginPlan.mockResolvedValue(plan)
      mocks.selectChain.mockResolvedValue(false)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-permit-refused' })
      })

      expect(mocks.signTypedData).not.toHaveBeenCalled()
    })

    // A create that FAILED never minted anything, so its request MUST stay stashed — that is the whole
    // point of the stash, and Retry is the only way back for the user.
    it('keeps the create stash when the POST itself failed', async () => {
      mocks.createMarginPlan.mockRejectedValue(new Error('network'))

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.executePlan({ request: fakeCreateRequest() })
      })

      expect(state().lastCreateRequest).toBeDefined()
    })

    // Keyed on the PLAN's swapper, so it cannot pollute the new wallet — and skipping it would cost
    // the owning wallet its resume banner for a plan already holding a subId reservation.
    it('still persists the plan pointer for the owning wallet on that same blip', async () => {
      clearPersistedPlanId(SWAPPER_A)
      const created = marginPlan({ planId: 'plan-create-blip-2', status: 'AWAITING_ACTION', steps: [] })
      mocks.createMarginPlan.mockImplementation(async () => {
        mocks.liveAddress = undefined
        return created
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.executePlan({ request: fakeCreateRequest() })
      })

      expect(getPersistedMarginPlanId(SWAPPER_A)?.planId).toBe('plan-create-blip-2')
    })

    it('bails before signing step 1 when the LIVE account no longer matches the plan swapper', async () => {
      let currentPlan = marginPlan({
        planId: 'plan-fix1-account',
        status: 'AWAITING_ACTION',
        steps: [permitStep({ stepIndex: 0 }), permitStep({ stepIndex: 1 })],
      })
      mocks.getMarginPlan.mockImplementation(async () => currentPlan)
      mocks.updateMarginPlan.mockImplementation(async ({ steps }: { steps: Array<{ stepIndex: number }> }) => {
        const stepIndex = steps[0].stepIndex
        currentPlan = {
          ...currentPlan,
          steps: currentPlan.steps.map((s) => (s.stepIndex === stepIndex ? { ...s, status: 'COMPLETE' } : s)),
        }
        if (stepIndex === 0) {
          // The wagmi client has already flipped to wallet B; React hasn't re-rendered this hook's
          // closure yet — exactly the gap closed by reading the LIVE account, not a captured one.
          mocks.liveAddress = SWAPPER_B
        }
        return currentPlan
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-fix1-account' })
      })

      expect(mocks.signTypedData).toHaveBeenCalledTimes(1)
    })
  })

  // CANCELLED must be loop-terminal — a resumed cancelled plan with a residual
  // AWAITING_ACTION step must never reach the wallet.
  describe('CANCELLED is loop-terminal', () => {
    it('resumePlan on a CANCELLED plan returns without prompting the wallet or PATCHing', async () => {
      const cancelledPlan = marginPlan({
        planId: 'plan-fix2-cancelled',
        status: 'CANCELLED',
        steps: [permitStep({ stepIndex: 0 })],
      })
      mocks.getMarginPlan.mockResolvedValue(cancelledPlan)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-fix2-cancelled' })
      })

      expect(mocks.signTypedData).not.toHaveBeenCalled()
      expect(mocks.updateMarginPlan).not.toHaveBeenCalled()
    })
  })

  // A terminal plan must never render the step list with no message and no CTA. The backend can stamp
  // an errorCode without a detail, and requiring BOTH fields left exactly that state on screen.
  describe('terminal step error surfacing', () => {
    it('surfaces a terminal step error carrying a code but no detail', async () => {
      const failedPlan = marginPlan({
        planId: 'plan-failed-no-detail',
        status: 'FAILED',
        steps: [permitStep({ stepIndex: 0, status: 'STEP_ERROR', errorCode: 'INSUFFICIENT_SOURCE_FUNDS' })],
      })
      mocks.getMarginPlan.mockResolvedValue(failedPlan)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-failed-no-detail' })
      })

      expect(state().stepError).toEqual({ stepIndex: 0, code: 'INSUFFICIENT_SOURCE_FUNDS', message: 'Step failed' })
    })

    // The pointer's only job is the resume banner, which shows for ANY pointer — so leaving one behind
    // offers a resume for a plan that can never advance. Cancel is unaffected: the pending section
    // reads the server's pendingPlans.
    it('clears the persisted pointer on a terminal plan, so no resume banner survives it', async () => {
      const failedPlan = marginPlan({
        planId: 'plan-failed-pointer',
        status: 'FAILED',
        steps: [permitStep({ stepIndex: 0, status: 'STEP_ERROR', errorCode: 'INSUFFICIENT_SOURCE_FUNDS' })],
      })
      persistPlanId({ swapper: SWAPPER_A, planId: 'plan-failed-pointer', intent: 'OPEN' })
      mocks.getMarginPlan.mockResolvedValue(failedPlan)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-failed-pointer' })
      })

      expect(getPersistedMarginPlanId(SWAPPER_A)).toBeUndefined()
    })

    // A CANCELLED plan carries no errorCode on any step, so the step-level path finds nothing. Without
    // a plan-level fallback the modal renders the step list with no message and no CTA — and
    // PLAN_TERMINAL is what makes that CTA a Restart rather than a Retry that would re-enter and exit
    // on the same status.
    it('falls back to a plan-level error when no step carries a code', async () => {
      const cancelled = marginPlan({
        planId: 'plan-cancelled-nocode',
        status: 'CANCELLED',
        steps: [permitStep({ stepIndex: 0 })],
      })
      mocks.getMarginPlan.mockResolvedValue(cancelled)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-cancelled-nocode' })
      })

      expect(state().stepError?.code).toBe('PLAN_TERMINAL')
      expect(state().stepError?.message).toBeTruthy()
      expect(isTerminalStepError(state().stepError?.code ?? '')).toBe(true)
    })

    // Hand-setting the step error above never traverses the path that PRODUCES the code: a FAILED plan
    // exits runLoop into abandonTerminalPlan, whose proof clear runs BEFORE surfaceTerminalStepError
    // sets it. Drive the real path, or the invariant above is certified by a state production never
    // reaches.
    it('KEEPS the proofs through the real terminal path, not just a hand-set error', async () => {
      const failed = marginPlan({
        planId: 'plan-terminal-proof',
        status: 'FAILED',
        steps: [permitStep({ stepIndex: 0, status: 'STEP_ERROR', errorCode: 'PROOF_UNRECOVERABLE' })],
      })
      persistPlanId({ swapper: SWAPPER_A, planId: 'plan-terminal-proof', intent: 'OPEN' })
      writeStepProof({
        swapper: SWAPPER_A,
        planId: 'plan-terminal-proof',
        stepIndex: 0,
        txHash: '0xdead',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x',
      })
      mocks.getMarginPlan.mockResolvedValue(failed)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-terminal-proof' })
      })

      expect(readStepProof({ swapper: SWAPPER_A, planId: 'plan-terminal-proof', stepIndex: 0 })).toBeDefined()
    })

    // The other side: a code that broadcast nothing still drops its proofs on the same real path. Two
    // steps, and the proof sits on the COMPLETED one — the failing step holding a proof is direct
    // evidence a tx exists for it, which outranks the code and keeps everything (covered above).
    it('drops the proofs through the real terminal path when nothing was broadcast', async () => {
      const failed = marginPlan({
        planId: 'plan-terminal-safe',
        status: 'FAILED',
        steps: [
          permitStep({ stepIndex: 0, status: 'COMPLETE' }),
          permitStep({ stepIndex: 1, status: 'STEP_ERROR', errorCode: 'INSUFFICIENT_SOURCE_FUNDS' }),
        ],
      })
      writeStepProof({
        swapper: SWAPPER_A,
        planId: 'plan-terminal-safe',
        stepIndex: 0,
        txHash: '0xdead',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x',
      })
      mocks.getMarginPlan.mockResolvedValue(failed)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-terminal-safe' })
      })

      expect(readStepProof({ swapper: SWAPPER_A, planId: 'plan-terminal-safe', stepIndex: 0 })).toBeUndefined()
    })

    // The post-GET supersession guard in resumePlan: the address must already differ when the GET
    // RESOLVES, otherwise the run gets past this guard and it is runLoop's own per-iteration check that
    // bails — a different code path. It must NOT release the lock: resumePlan never acquires one.
    it('bails after the resume GET without freeing another run’s lock', async () => {
      const plan = marginPlan({ planId: 'plan-resume-superseded', status: 'AWAITING_ACTION', steps: [] })
      mocks.getMarginPlan.mockImplementation(async () => {
        mocks.liveAddress = SWAPPER_B
        return plan
      })
      // A live run owns the lock at the current generation.
      const held = actions().tryAcquireExecution({ planId: 'other-live-plan' })
      expect(held.acquired).toBe(true)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-resume-superseded' })
      })

      // The other run still holds it — releasing here would let the next Open mint a second plan.
      expect(state().isExecuting).toBe(true)
      expect(state().executingPlanId).toBe('other-live-plan')
      // And it must not be stamped with THIS resume's error: resumePlan borrows `currentEpoch()`, so an
      // ungated write would pass the store's equality guard and take away the live run's Continue.
      expect(state().stepError).toBeUndefined()
    })

    // With nothing executing, the same exit DOES surface the reason — otherwise the modal is an
    // indefinite spinner with no CTA, which is what this write was added for.
    it('surfaces the reason on that exit when no other run owns the lock', async () => {
      const plan = marginPlan({ planId: 'plan-resume-superseded-idle', status: 'AWAITING_ACTION', steps: [] })
      mocks.getMarginPlan.mockImplementation(async () => {
        mocks.liveAddress = SWAPPER_B
        return plan
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-resume-superseded-idle' })
      })

      expect(state().stepError?.code).toBe('WRONG_ACCOUNT')
    })

    // The expired-plan branch must clear the PLAN, not just its pointer: useIsPlanInFlight is
    // `plan !== undefined && !isTerminalPlanStatus(status)`, and every management CTA gates on it — so
    // leaving a TTL-expired plan in the store locks close/add/withdraw for a live position with no exit
    // but a reload.
    it('clears the stuck plan when the record has expired, so management CTAs unlock', async () => {
      const stuck = marginPlan({ planId: 'plan-expired', status: 'AWAITING_ACTION', steps: [] })
      actions().setPlan({ plan: stuck, epoch: actions().currentEpoch() })
      mocks.getMarginPlan.mockRejectedValue(new FetchError({ response: { status: 404 } as Response }))

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-expired' })
      })

      expect(state().plan).toBeUndefined()
    })

    // The pointer/proof clears are keyed to the EXPIRED plan and are always safe; everything after them
    // writes the CURRENT UI. Mid-create the store holds no plan, so an ungated branch takes the `else`
    // and closes the live create's modal — which parks its just-minted plan.
    it('leaves a foreign run’s modal alone when an unrelated record has expired', async () => {
      const held = actions().tryAcquireExecution({ planId: 'PENDING_CREATE' })
      expect(held.acquired).toBe(true)
      actions().setModalOpen(true)
      mocks.getMarginPlan.mockRejectedValue(new FetchError({ response: { status: 404 } as Response }))

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-expired-foreign' })
      })

      expect(state().isModalOpen).toBe(true)
    })

    // A create failure and a resume failure render the SAME `!plan && stepError` surface, and the stash
    // is what arms its Retry — so a stash surviving from an earlier create would offer "Retry create"
    // on a resume error, and pressing it re-POSTs the stale request: a second plan and subId through
    // the resume door.
    it('drops a stale create stash when a resume fails, so its Retry cannot re-POST', async () => {
      actions().setLastCreateRequest({ request: fakeCreateRequest(), epoch: actions().currentEpoch() })
      mocks.getMarginPlan.mockRejectedValue(new FetchError({ response: { status: 500 } as Response }))

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-resume-boom' })
      })

      expect(state().stepError?.code).toBe('PLAN_RESUME_FAILED')
      expect(state().lastCreateRequest).toBeUndefined()
    })

    // The GET can SUCCEED and a failure still land on the same surface: runLoop is entered OUTSIDE
    // that try, so its connectivity guard throws before setPlan and its catch renders `!plan &&
    // stepError` — with Retry armed on a stale create request that would mint a second plan while the
    // resumed one holds its reservation. Clearing on handoff covers that exit and every other one
    // downstream of it.
    it('drops a stale create stash once a resume takes over the surface', async () => {
      actions().setLastCreateRequest({ request: fakeCreateRequest(), epoch: actions().currentEpoch() })
      // A loop-terminal plan: the resume proceeds past the GET and hands off to runLoop, which is the
      // path the stash clear sits on, without needing the loop to actually run.
      mocks.getMarginPlan.mockResolvedValue(
        marginPlan({ planId: 'plan-resume-runloop', status: 'CANCELLED', steps: [] }),
      )

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-resume-runloop' })
      })

      expect(state().lastCreateRequest).toBeUndefined()
    })

    // Scoped to THIS plan: resuming an expired record must not reset a different run executing normally.
    it('leaves another run’s plan alone when an unrelated record has expired', async () => {
      const live = marginPlan({ planId: 'plan-live', status: 'AWAITING_ACTION', steps: [] })
      actions().setPlan({ plan: live, epoch: actions().currentEpoch() })
      mocks.getMarginPlan.mockRejectedValue(new FetchError({ response: { status: 404 } as Response }))

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-expired-other' })
      })

      expect(state().plan?.planId).toBe('plan-live')
    })

    it('prefers the server detail when it is present', async () => {
      const failedPlan = marginPlan({
        planId: 'plan-failed-with-detail',
        status: 'FAILED',
        steps: [
          permitStep({
            stepIndex: 0,
            status: 'STEP_ERROR',
            errorCode: 'INSUFFICIENT_SOURCE_FUNDS',
            errorDetail: 'the reason',
          }),
        ],
      })
      mocks.getMarginPlan.mockResolvedValue(failedPlan)

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-failed-with-detail' })
      })

      expect(state().stepError).toEqual({ stepIndex: 0, code: 'INSUFFICIENT_SOURCE_FUNDS', message: 'the reason' })
    })
  })

  // The wallet-funded open: the collateral its own pre-swap delivered sits in the EOA until this
  // step pulls it, so the user can spend it in between. An under-funded pull reverts on-chain and —
  // because the hash is persisted BEFORE the PATCH — replays that revert on every resume. The check
  // must fail CLOSED and never resize the leg down to what remains.
  describe('MARGIN_OPEN pre-broadcast collateral check', () => {
    // The open's OWN calldata is a nested router struct the client carries no ABI for, so the pull is
    // priced off the step's `tokenInAmount` where the backend states one, and falls back to the
    // COLLATERAL permit this client already signed. In practice the permit is rarely the source: the
    // backend signs collateral permits at the MaxUint160 allowance cap, which is a ceiling rather than
    // a pull and is discarded — Permit2 still bounds the on-chain transfer by it either way.
    function collateralPermitStep(overrides: Partial<MarginPlanStep> = {}): MarginPlanStep {
      return {
        stepIndex: 0,
        stepType: 'APPROVAL_PERMIT',
        method: 'SIGN_MSG',
        payloadType: 'EIP_712',
        payload: permitPayload({ spender: MARGIN_ROUTER_ADDRESS, token: BASE_USDC, amount: '1000' }),
        status: 'COMPLETE',
        ...overrides,
      }
    }

    function openStep(overrides: Partial<MarginPlanStep> = {}): MarginPlanStep {
      return {
        stepIndex: 1,
        stepType: 'MARGIN_OPEN',
        method: 'SEND_TX',
        payloadType: 'TX',
        // Case C carries NO tokenInAmount — its size is the pre-swap receipt, known only server-side.
        tokenIn: BASE_USDC,
        payload: { to: MARGIN_ROUTER_ADDRESS, data: '0xdeadbeef', chainId: MARGIN_CHAIN_ID },
        status: 'AWAITING_ACTION',
        ...overrides,
      }
    }

    // Redux's addTransaction refuses to overwrite an existing hash and every broadcast OPEN writes an
    // activity row, so each run needs its own hash or a later test inherits the earlier one's.
    let openRun = 0
    function runOpen({ steps, balance }: { steps: MarginPlanStep[]; balance?: bigint }) {
      openRun += 1
      mocks.sendTransaction.mockResolvedValue({ hash: `0xopen${openRun}` })
      const plan = marginPlan({
        planId: 'plan-open-balance',
        intent: 'OPEN',
        collateralToken: BASE_USDC,
        status: 'AWAITING_ACTION',
        steps,
      })
      let currentPlan = plan
      mocks.getMarginPlan.mockImplementation(async () => currentPlan)
      mocks.updateMarginPlan.mockImplementation(async () => {
        currentPlan = {
          ...currentPlan,
          status: 'COMPLETED',
          steps: currentPlan.steps.map((s) => ({ ...s, status: 'COMPLETE' })),
        }
        return currentPlan
      })
      if (balance !== undefined) {
        mocks.balanceOf.mockResolvedValue(balance)
      }
      const { result } = renderExecuteMarginPlanHook()
      return act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-open-balance' })
      })
    }

    it('never broadcasts the open when the wallet no longer covers the permitted collateral', async () => {
      await runOpen({ steps: [collateralPermitStep(), openStep()], balance: 999n })

      expect(mocks.sendTransaction).not.toHaveBeenCalled()
      expect(mocks.updateMarginPlan).not.toHaveBeenCalled()
      expect(marginPlanExecutionStore.getState().stepError?.code).toBe('INSUFFICIENT_SOURCE_FUNDS')
      // Blocked BEFORE the chain switch, so the failure surfaces with no wallet network prompt.
      expect(mocks.selectChain).not.toHaveBeenCalled()
    })

    it('broadcasts the open when the wallet exactly covers the permitted collateral', async () => {
      await runOpen({ steps: [collateralPermitStep(), openStep()], balance: 1000n })

      expect(mocks.sendTransaction).toHaveBeenCalledTimes(1)
      expect(marginPlanExecutionStore.getState().stepError).toBeUndefined()
    })

    // The permit is the priced source precisely BECAUSE the step's own amount field is absent here:
    // a check that trusted tokenInAmount would have nothing to compare and wave the step through.
    it('prices the pull off the open step tokenInAmount, not the signed permit', async () => {
      await runOpen({
        steps: [collateralPermitStep(), openStep({ tokenInAmount: '1' })],
        balance: 999n,
      })

      // The permit caps at 1000 but the step only pulls 1, and 999 covers it — the open proceeds.
      expect(mocks.sendTransaction).toHaveBeenCalledTimes(1)
      expect(marginPlanExecutionStore.getState().stepError?.code).toBeUndefined()
    })

    // A collateral permit signed at the AllowanceTransfer cap carries no figure. Reading it as one
    // would block every open whose wallet balance is (necessarily) below MaxUint160.
    it('does not block an open behind a MaxUint160 collateral permit', async () => {
      await runOpen({
        steps: [
          collateralPermitStep({
            payload: permitPayload({
              spender: MARGIN_ROUTER_ADDRESS,
              token: BASE_USDC,
              amount: ((1n << 160n) - 1n).toString(),
            }),
          }),
          openStep(),
        ],
        balance: 1000n,
      })

      expect(mocks.sendTransaction).toHaveBeenCalledTimes(1)
      expect(marginPlanExecutionStore.getState().stepError?.code).toBeUndefined()
    })

    // A PAYMENT permit names the Universal Router and is already spent by the pre-swap — it must
    // never size the open. With no router permit left, the pull is unpriced and only an EMPTY wallet
    // is provably doomed.
    it('never sizes the open off a Universal Router payment permit', async () => {
      await runOpen({
        steps: [
          collateralPermitStep({ payload: permitPayload({ spender: UNIVERSAL_ROUTER, amount: '1000' }) }),
          openStep(),
        ],
        balance: 1n,
      })

      expect(mocks.sendTransaction).toHaveBeenCalledTimes(1)
    })

    it('blocks an unpriced open against a completely empty wallet', async () => {
      await runOpen({ steps: [openStep({ stepIndex: 0 })], balance: 0n })

      expect(mocks.sendTransaction).not.toHaveBeenCalled()
      expect(marginPlanExecutionStore.getState().stepError?.code).toBe('INSUFFICIENT_SOURCE_FUNDS')
    })

    // Case B funds equity through msg.value, so there is no ERC-20 pull to price and the wallet
    // itself refuses an underfunded value — a balance read here would only false-block.
    it('skips the check entirely for a native-funded open', async () => {
      await runOpen({ steps: [openStep({ stepIndex: 0, tokenIn: MARGIN_NATIVE_TOKEN_ADDRESS })] })

      expect(mocks.sendTransaction).toHaveBeenCalledTimes(1)
      expect(mocks.balanceOf).not.toHaveBeenCalled()
    })

    it('surfaces a retryable CLIENT_ERROR when the chain client is transiently unavailable', async () => {
      vi.spyOn(logger, 'error').mockImplementation(() => undefined)
      mocks.getClient.mockReturnValue(undefined)
      await runOpen({ steps: [collateralPermitStep(), openStep()] })

      expect(mocks.sendTransaction).not.toHaveBeenCalled()
      expect(marginPlanExecutionStore.getState().stepError?.code).toBe('CLIENT_ERROR')
    })
  })

  // Modal-closed park gate: closing the steps modal backgrounds the run only until the NEXT wallet
  // prompt — the loop finishes watching in-flight work, then parks (step stays AWAITING_ACTION, lock
  // released) instead of popping a prompt with no modal context. Both entry points force the modal
  // open, so the tests flip it mid-loop via the PATCH / selectChain mocks (the FIX-1 pattern).
  describe('modal-closed park gate', () => {
    it('parks before the next prompt when the modal closes mid-run: no second sign, lock released, positions invalidated', async () => {
      let currentPlan = marginPlan({
        planId: 'plan-park-gate',
        status: 'AWAITING_ACTION',
        steps: [permitStep({ stepIndex: 0 }), permitStep({ stepIndex: 1 })],
      })
      mocks.getMarginPlan.mockImplementation(async () => currentPlan)
      mocks.updateMarginPlan.mockImplementation(async ({ steps }: { steps: Array<{ stepIndex: number }> }) => {
        const stepIndex = steps[0].stepIndex
        currentPlan = {
          ...currentPlan,
          steps: currentPlan.steps.map((s) => (s.stepIndex === stepIndex ? { ...s, status: 'COMPLETE' } : s)),
        }
        if (stepIndex === 0) {
          // User dismisses the steps modal while step 0 verifies.
          marginPlanExecutionStore.getState().actions.setModalOpen(false)
        }
        return currentPlan
      })

      const { result, invalidateSpy } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-park-gate' })
      })

      // Step 0 signed; the gate parked the loop before step 1 could prompt.
      expect(mocks.signTypedData).toHaveBeenCalledTimes(1)
      expect(state().stepError).toBeUndefined()
      expect(state().plan?.status).toBe('AWAITING_ACTION')
      expect(state().executingPlanId).toBeUndefined()
      expect(state().isExecuting).toBe(false)
      // The park invalidates positions so the pending card surfaces without waiting for the poll.
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.TradingApi, 'margin/positions'] })
    })

    it('re-checks the gate after the chain-switch window: closing during selectChain parks before the tx prompt', async () => {
      const plan = marginPlan({
        planId: 'plan-park-switch',
        status: 'AWAITING_ACTION',
        steps: [
          {
            stepIndex: 0,
            stepType: 'MARGIN_OPEN',
            method: 'SEND_TX',
            payloadType: 'TX',
            payload: { to: '0x000000000000000000000000000000000000dEaD', data: '0x', chainId: MARGIN_CHAIN_ID },
            status: 'AWAITING_ACTION',
          },
        ],
      })
      mocks.getMarginPlan.mockResolvedValue(plan)
      // Dismissal is NOT blocked during the network-switch prompt — the user closes there, then the
      // switch resolves approved.
      mocks.selectChain.mockImplementation(async () => {
        marginPlanExecutionStore.getState().actions.setModalOpen(false)
        return true
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-park-switch' })
      })

      // Nothing was broadcast or PATCHed — the re-check parked between the switch and the prompt.
      expect(mocks.updateMarginPlan).not.toHaveBeenCalled()
      expect(state().stepError).toBeUndefined()
      expect(state().executingPlanId).toBeUndefined()
    })

    it('does not park while the modal stays open — the loop drives every step to completion', async () => {
      let currentPlan = marginPlan({
        planId: 'plan-park-control',
        status: 'AWAITING_ACTION',
        steps: [permitStep({ stepIndex: 0 }), permitStep({ stepIndex: 1 })],
      })
      mocks.getMarginPlan.mockImplementation(async () => currentPlan)
      mocks.updateMarginPlan.mockImplementation(async ({ steps }: { steps: Array<{ stepIndex: number }> }) => {
        const stepIndex = steps[0].stepIndex
        const nextSteps = currentPlan.steps.map((s) =>
          s.stepIndex === stepIndex ? { ...s, status: 'COMPLETE' as const } : s,
        )
        currentPlan = {
          ...currentPlan,
          steps: nextSteps,
          status: nextSteps.every((s) => s.status === 'COMPLETE') ? 'COMPLETED' : currentPlan.status,
        }
        return currentPlan
      })

      const { result } = renderExecuteMarginPlanHook()
      await act(async () => {
        await result.current.exec.resumePlan({ planId: 'plan-park-control' })
      })

      expect(mocks.signTypedData).toHaveBeenCalledTimes(2)
      expect(state().plan?.status).toBe('COMPLETED')
    })
  })
})

describe('buildStepActivityInfo — MARGIN_ADJUST', () => {
  function adjustPlan(): MarginPlanResponse {
    return fakePlan({ intent: 'ADJUST', marketKey: 'mk', collateralToken: '0xc', debtToken: '0xd' })
  }
  function adjustStep(overrides: Partial<MarginPlanStep> = {}): MarginPlanStep {
    return {
      stepIndex: 0,
      stepType: 'MARGIN_ADJUST',
      method: 'SEND_TX',
      payloadType: 'TX',
      payload: { to: '0xrouter', data: '0x', chainId: 1 },
      status: 'AWAITING_ACTION',
      ...overrides,
    }
  }

  it('registers a MarginAddCollateral row for a deposit adjust (payment amount present)', () => {
    const info = buildStepActivityInfo({
      plan: adjustPlan(),
      step: adjustStep(),
      createRequest: fakeCreateRequest({
        marginQuote: { action: 'addEquity', swapConfig: { token: '0xpay', amount: '500' } },
      }),
    })
    expect(info).toMatchObject({ type: TransactionType.MarginAddCollateral, amount: '500' })
  })

  it('prefers the step wire amount over the create-request payment amount', () => {
    const info = buildStepActivityInfo({
      plan: adjustPlan(),
      step: adjustStep({ tokenInAmount: '900' }),
      createRequest: fakeCreateRequest({
        marginQuote: { action: 'addEquity', swapConfig: { token: '0xpay', amount: '500' } },
      }),
    })
    expect(info).toMatchObject({ amount: '900' })
  })

  it('emits no activity row for a withdraw or leverage-only adjust (no payment in)', () => {
    // A withdrawal names a token too (it is what the user gets back), so only the ACTION KEY can say
    // which way equity moved — keying off swapConfig.token would file a withdrawal as a deposit.
    expect(
      buildStepActivityInfo({
        plan: adjustPlan(),
        // The REAL wire shape for a non-deposit adjust: the backend sends '0', not absence, so a
        // fixture leaving tokenInAmount undefined would not exercise the sentinel the source guards.
        step: adjustStep({ tokenInAmount: '0' }),
        createRequest: fakeCreateRequest({
          marginQuote: { action: 'withdrawEquity', swapConfig: { token: '0xpay', amount: '250' } },
        }),
      }),
    ).toBeUndefined()
    expect(
      buildStepActivityInfo({
        plan: adjustPlan(),
        step: adjustStep({ tokenInAmount: '0' }),
        createRequest: fakeCreateRequest({ marginQuote: { action: 'increaseLeverage' } }),
      }),
    ).toBeUndefined()
    expect(buildStepActivityInfo({ plan: adjustPlan(), step: adjustStep() })).toBeUndefined()
  })
})

describe('buildStepActivityInfo — MARGIN_OPEN', () => {
  function openPlan(): MarginPlanResponse {
    return fakePlan({ intent: 'OPEN', marketKey: 'mk', collateralToken: '0xc', debtToken: '0xd' })
  }
  function openStep(overrides: Partial<MarginPlanStep> = {}): MarginPlanStep {
    return {
      stepIndex: 0,
      stepType: 'MARGIN_OPEN',
      method: 'SEND_TX',
      payloadType: 'TX',
      payload: { to: '0xrouter', data: '0x', chainId: 1 },
      status: 'AWAITING_ACTION',
      ...overrides,
    }
  }

  it('files the wallet pull as the margin amount when the step states one', () => {
    const info = buildStepActivityInfo({
      plan: openPlan(),
      step: openStep({ tokenInAmount: '750' }),
      createRequest: fakeCreateRequest({ marginQuote: { legs: [], swapConfig: { token: '0xpay', amount: '500' } } }),
    })
    expect(info).toMatchObject({ marginAmount: '750' })
  })

  // A pre-swap-funded open has no wallet pull, and the backend states that as '0' rather than absence.
  // Taking it literally files the activity row as a zero-margin open while the real figure sits on the
  // quote — the same wire shape the ADJUST branch already guards.
  it('reads the quote’s amount when the step reports a zero pull', () => {
    const info = buildStepActivityInfo({
      plan: openPlan(),
      step: openStep({ tokenInAmount: '0' }),
      createRequest: fakeCreateRequest({ marginQuote: { legs: [], swapConfig: { token: '0xpay', amount: '500' } } }),
    })
    expect(info).toMatchObject({ marginAmount: '500' })
  })
})

describe('marginPlanPointer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('persistPlanId is best-effort — a throwing setItem (Safari private / quota) does not throw', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

    // Must NOT throw — an uncaught throw here would strand the execution lock held by executePlan.
    expect(() => persistPlanId({ swapper: SWAPPER_A, planId: 'plan-1', intent: 'OPEN' })).not.toThrow()
    expect(setItem).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledOnce()
  })

  it('round-trips a pointer through localStorage (case-insensitive swapper key)', () => {
    persistPlanId({ swapper: SWAPPER_A, planId: 'plan-7', intent: 'CLOSE' })
    expect(getPersistedMarginPlanId(SWAPPER_A.toLowerCase())).toEqual({ planId: 'plan-7', intent: 'CLOSE' })
  })
})

// The index-keyed reader cannot answer "did this plan broadcast at all", which is the only question
// available when no step is named — a plan that broadcast, never PATCHed, and died with nothing stamped.
describe('planHasProofForSteps', () => {
  const SWAPPER = '0x00000000000000000000000000000000000000A1'
  const proofAt = (planId: string, stepIndex: number): void =>
    writeStepProof({
      swapper: SWAPPER,
      planId,
      stepIndex,
      txHash: '0xdead',
      to: '0x0000000000000000000000000000000000000001',
      data: '0x',
    })

  it('reports false for a plan with no cached proofs', () => {
    expect(planHasProofForSteps({ swapper: SWAPPER, planId: 'plan-any-none', stepIndexes: [0, 1, 2] })).toBe(false)
  })

  it('reports true from any step index, not just the first', () => {
    proofAt('plan-any-some', 3)
    expect(planHasProofForSteps({ swapper: SWAPPER, planId: 'plan-any-some', stepIndexes: [1, 3] })).toBe(true)
  })

  // The reason the caller passes indices rather than this scanning everything: EVERY SEND_TX writes a
  // proof, approvals included, and an approval moves nothing. A plan that only broadcast an approve
  // would otherwise be reported as having moved funds.
  it('ignores proofs on steps the caller did not ask about', () => {
    proofAt('plan-any-approval', 0)
    expect(planHasProofForSteps({ swapper: SWAPPER, planId: 'plan-any-approval', stepIndexes: [1, 2] })).toBe(false)
    expect(planHasProofForSteps({ swapper: SWAPPER, planId: 'plan-any-approval', stepIndexes: [0] })).toBe(true)
  })

  it('goes back to false once the plan proofs are cleared', () => {
    proofAt('plan-any-cleared', 0)
    clearPlanProofs({ swapper: SWAPPER, planId: 'plan-any-cleared' })
    expect(planHasProofForSteps({ swapper: SWAPPER, planId: 'plan-any-cleared', stepIndexes: [0] })).toBe(false)
  })
})
