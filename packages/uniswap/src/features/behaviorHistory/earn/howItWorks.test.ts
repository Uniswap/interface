import { selectHasAcknowledgedEarnHowItWorks } from 'uniswap/src/features/behaviorHistory/selectors'
import {
  initialUniswapBehaviorHistoryState,
  setHasAcknowledgedEarnHowItWorks,
  uniswapBehaviorHistoryReducer,
} from 'uniswap/src/features/behaviorHistory/slice'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'

describe('Earn How it works behavior history', () => {
  it('defaults to not acknowledged for existing persisted state', () => {
    const { earnHowItWorksAcknowledgedByVaultId: _newField, ...legacyBehaviorHistory } =
      initialUniswapBehaviorHistoryState
    const state = {
      uniswapBehaviorHistory: legacyBehaviorHistory,
    } as UniswapState

    expect(selectHasAcknowledgedEarnHowItWorks(state, 'vault-a')).toBe(false)
  })

  it('persists the acknowledgement for only the selected vault', () => {
    const behaviorHistory = uniswapBehaviorHistoryReducer(
      initialUniswapBehaviorHistoryState,
      setHasAcknowledgedEarnHowItWorks({ vaultId: 'vault-a' }),
    )
    const state = { uniswapBehaviorHistory: behaviorHistory } as UniswapState

    expect(selectHasAcknowledgedEarnHowItWorks(state, 'vault-a')).toBe(true)
    expect(selectHasAcknowledgedEarnHowItWorks(state, 'vault-b')).toBe(false)
  })
})
