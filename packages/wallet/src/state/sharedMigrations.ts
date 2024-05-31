/* eslint-disable @typescript-eslint/no-explicit-any */

// Mobile: 63
// Extension: 0
export function removeWalletIsUnlockedState(state: any): any {
  const newState = { ...state }
  delete newState?.wallet?.isUnlocked

  return newState
}
