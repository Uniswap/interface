import {
  initialUniswapBehaviorHistoryState,
  setNewUserOnboardingWalletFlag,
  uniswapBehaviorHistoryReducer,
  type UniswapBehaviorHistoryState,
} from 'uniswap/src/features/behaviorHistory/slice'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import {
  type FinalizedTransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { describe, expect, it } from 'vitest'

const ADDRESS = '0xAbC0000000000000000000000000000000000001'
const ADDRESS_KEY = '0xabc0000000000000000000000000000000000001'

function finalized({
  type,
  status = TransactionStatus.Success,
  earnAction,
  stepDetails = [],
}: {
  type: TransactionType
  status?: TransactionStatus
  earnAction?: string
  stepDetails?: { typeInfo: { type: TransactionType } }[]
}): FinalizedTransactionDetails {
  return {
    id: 'tx',
    from: ADDRESS,
    chainId: 1,
    hash: '0xhash',
    status,
    addedTime: 0,
    typeInfo: { type, earnAction, stepDetails },
  } as unknown as FinalizedTransactionDetails
}

function reduce(
  actions: Parameters<typeof uniswapBehaviorHistoryReducer>[1][],
  state: UniswapBehaviorHistoryState = initialUniswapBehaviorHistoryState,
): UniswapBehaviorHistoryState {
  return actions.reduce(uniswapBehaviorHistoryReducer, state)
}

describe('new user onboarding behavior history', () => {
  it('keys entries by lowercased address and sets each flag', () => {
    const state = reduce([
      setNewUserOnboardingWalletFlag({ address: ADDRESS, flag: 'hasBeenFunded' }),
      setNewUserOnboardingWalletFlag({ address: ADDRESS, flag: 'hasCompletedSwap' }),
      setNewUserOnboardingWalletFlag({ address: ADDRESS, flag: 'guidedSwapDismissed' }),
    ])

    expect(state.newUserOnboarding?.byWallet).toEqual({
      [ADDRESS_KEY]: {
        hasBeenFunded: true,
        hasCompletedSwap: true,
        guidedSwapDismissed: true,
      },
    })
  })

  it('creates the record for state persisted before the field existed', () => {
    const state = reduce([setNewUserOnboardingWalletFlag({ address: ADDRESS, flag: 'hasBeenFunded' })], {})
    expect(state.newUserOnboarding?.byWallet[ADDRESS_KEY]).toEqual({ hasBeenFunded: true })
  })

  describe('on finalizeTransaction', () => {
    it.each([TransactionType.Swap, TransactionType.Bridge, TransactionType.Plan])('records a successful %s', (type) => {
      const state = reduce([finalizeTransaction(finalized({ type }))])
      expect(state.newUserOnboarding?.byWallet[ADDRESS_KEY]?.hasCompletedSwap).toBe(true)
    })

    it('ignores failed swaps, earn plans and other transaction types', () => {
      const state = reduce([
        finalizeTransaction(finalized({ type: TransactionType.Swap, status: TransactionStatus.Failed })),
        finalizeTransaction(finalized({ type: TransactionType.Plan, earnAction: 'deposit' })),
        // DAPI doesn't set earnAction on vault plans
        finalizeTransaction(
          finalized({ type: TransactionType.Plan, stepDetails: [{ typeInfo: { type: TransactionType.Unknown } }] }),
        ),
        finalizeTransaction(finalized({ type: TransactionType.Send })),
      ])
      expect(state.newUserOnboarding?.byWallet).toEqual({})
    })
  })
})
