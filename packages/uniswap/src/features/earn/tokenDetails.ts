import type { TokenDetailsEarnData } from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'

export function shouldShowTokenDetailsEarnBanner({
  earnVault,
  hasLoadedPositions,
  isLoggedIn,
  userHasEarnPosition,
}: Pick<TokenDetailsEarnData, 'earnVault' | 'hasLoadedPositions' | 'isLoggedIn' | 'userHasEarnPosition'>): boolean {
  if (!earnVault || userHasEarnPosition) {
    return false
  }

  return !isLoggedIn || hasLoadedPositions
}
