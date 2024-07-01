/* eslint-disable @typescript-eslint/no-explicit-any */

// Mobile: 63
// Extension: 0
export function removeWalletIsUnlockedState(state: any): any {
  const newState = { ...state }
  delete newState?.wallet?.isUnlocked

  return newState
}

// Mobile: 64
// Extension: 1
export function removeUniconV2BehaviorState(state: any): any {
  const newState = { ...state }
  delete newState?.behaviorHistory?.hasViewedUniconV2IntroModal
  return newState
}
