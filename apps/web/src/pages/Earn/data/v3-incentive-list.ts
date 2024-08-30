const MIN_TICK = -887272
const MAX_TICK = 887272

export interface IncentiveKey {
  rewardToken: string
  pool: string
  startTime: number
  lockTime: number
  minimumTickRange: number
  maxTickLower: number
  minTickLower: number
  maxTickUpper: number
  minTickUpper: number
}

const incentiveKeys: Record<string, IncentiveKey> = {
  '0xa3f6bdb776ca3306a13103f22f7ac388dd02abd1e069229d4bc18c1e5cd17fea': {
    rewardToken: '0x71e26d0e519d14591b9de9a0fe9513a398101490',
    pool: '0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19',
    startTime: 1725033815,
    lockTime: 0,
    minimumTickRange: 0,
    maxTickLower: MAX_TICK,
    minTickLower: MIN_TICK,
    maxTickUpper: MAX_TICK,
    minTickUpper: MIN_TICK,
  },
}
const incentiveIds: string[] = ['0xa3f6bdb776ca3306a13103f22f7ac388dd02abd1e069229d4bc18c1e5cd17fea']

export function getAllIncentiveIds() {
  return incentiveIds
}

export function getIncentiveIdsByPool(poolAddress: string) {
  return incentiveIds.filter((incentiveId) => {
    return incentiveKeys[incentiveId].pool == poolAddress
  })
}

export function getIncentiveKey(incentiveId: string) {
  return incentiveKeys[incentiveId]
}
