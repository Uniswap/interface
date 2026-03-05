import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  ActivePlanData,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'

function createMockActivePlan(planId: string): ActivePlanData {
  return {
    response: {} as ActivePlanData['response'],
    planId,
    inputChainId: UniverseChainId.Mainnet,
    steps: [],
    proofPending: false,
    currentStepIndex: 0,
  }
}

describe('activePlanStore — execution lock', () => {
  beforeEach(() => {
    activePlanStore.setState({
      activePlan: undefined,
      backgroundedPlans: {},
      cancelledPlanIds: new Set(),
      executionLockPlanId: null,
    })
  })

  it('lockPlanForExecution sets the lock to the given planId', () => {
    activePlanStore.getState().actions.lockPlanForExecution('plan-A')
    expect(activePlanStore.getState().executionLockPlanId).toBe('plan-A')
  })

  it('unlockPlanForExecution clears the lock when planId matches', () => {
    activePlanStore.getState().actions.lockPlanForExecution('plan-A')
    activePlanStore.getState().actions.unlockPlanForExecution('plan-A')
    expect(activePlanStore.getState().executionLockPlanId).toBeNull()
  })

  it('unlockPlanForExecution is a no-op when planId does not match', () => {
    activePlanStore.getState().actions.lockPlanForExecution('plan-B')
    activePlanStore.getState().actions.unlockPlanForExecution('plan-A')
    expect(activePlanStore.getState().executionLockPlanId).toBe('plan-B')
  })

  it('resetActivePlan does NOT clear the execution lock', () => {
    activePlanStore.getState().actions.setActivePlan(createMockActivePlan('plan-A'))
    activePlanStore.getState().actions.lockPlanForExecution('plan-A')

    activePlanStore.getState().actions.resetActivePlan()

    expect(activePlanStore.getState().activePlan).toBeUndefined()
    expect(activePlanStore.getState().executionLockPlanId).toBe('plan-A')
  })

  describe('concurrent saga scenario', () => {
    it('Plan A lock → Plan B lock → Plan A unlock is no-op → Plan B unlock clears', () => {
      // Plan A acquires the lock
      activePlanStore.getState().actions.lockPlanForExecution('plan-A')
      expect(activePlanStore.getState().executionLockPlanId).toBe('plan-A')

      // Plan B starts and overwrites the lock
      activePlanStore.getState().actions.lockPlanForExecution('plan-B')
      expect(activePlanStore.getState().executionLockPlanId).toBe('plan-B')

      // Plan A's finally runs — should NOT clear Plan B's lock
      activePlanStore.getState().actions.unlockPlanForExecution('plan-A')
      expect(activePlanStore.getState().executionLockPlanId).toBe('plan-B')

      // Plan B's finally runs — should clear the lock
      activePlanStore.getState().actions.unlockPlanForExecution('plan-B')
      expect(activePlanStore.getState().executionLockPlanId).toBeNull()
    })
  })

  describe('resetActivePlan + unlockPlanForExecution interaction', () => {
    it('resetActivePlan followed by unlockPlanForExecution correctly releases the lock', () => {
      activePlanStore.getState().actions.setActivePlan(createMockActivePlan('plan-A'))
      activePlanStore.getState().actions.lockPlanForExecution('plan-A')

      // Saga calls resetActivePlan (e.g., on price change or error on first step)
      activePlanStore.getState().actions.resetActivePlan()
      expect(activePlanStore.getState().activePlan).toBeUndefined()
      // Lock is still held — resetActivePlan doesn't touch it
      expect(activePlanStore.getState().executionLockPlanId).toBe('plan-A')

      // Saga's finally block releases the lock
      activePlanStore.getState().actions.unlockPlanForExecution('plan-A')
      expect(activePlanStore.getState().executionLockPlanId).toBeNull()
    })
  })

  describe('isPlanExecutionLocked selector logic', () => {
    it('lock is only considered active when it matches the active plan', () => {
      const isPlanExecutionLocked = (): boolean => {
        const state = activePlanStore.getState()
        return state.executionLockPlanId != null && state.executionLockPlanId === state.activePlan?.planId
      }

      // No active plan, no lock
      expect(isPlanExecutionLocked()).toBe(false)

      // Active plan but no lock
      activePlanStore.getState().actions.setActivePlan(createMockActivePlan('plan-A'))
      expect(isPlanExecutionLocked()).toBe(false)

      // Active plan with matching lock
      activePlanStore.getState().actions.lockPlanForExecution('plan-A')
      expect(isPlanExecutionLocked()).toBe(true)

      // Lock for a different plan than the active one (backgrounded scenario)
      activePlanStore.getState().actions.setActivePlan(createMockActivePlan('plan-B'))
      expect(isPlanExecutionLocked()).toBe(false)

      // Lock matches the new active plan
      activePlanStore.getState().actions.lockPlanForExecution('plan-B')
      expect(isPlanExecutionLocked()).toBe(true)

      // resetActivePlan clears the plan but not the lock — selector returns false
      activePlanStore.getState().actions.resetActivePlan()
      expect(isPlanExecutionLocked()).toBe(false)
    })
  })
})
