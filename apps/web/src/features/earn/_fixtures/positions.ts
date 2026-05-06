export interface MockEarnPosition {
  vaultId: string
  depositedUsd: number
  rewardsUsd: number
  apyPercent: number
}

// Mocked wallet positions for FE-4 (CONS-1782). Backend contracts
// (`ListEarnPositions`, `GetEarnPosition`) land later in M1.
export const MOCK_EARN_POSITIONS: readonly MockEarnPosition[] = [
  {
    vaultId: 'mock-vault-usdc',
    depositedUsd: 2345.67,
    rewardsUsd: 0.000016,
    apyPercent: 5.23,
  },
]

export function findMockEarnPosition(vaultId: string | undefined): MockEarnPosition | undefined {
  if (!vaultId) {
    return undefined
  }
  return MOCK_EARN_POSITIONS.find((position) => position.vaultId === vaultId)
}
