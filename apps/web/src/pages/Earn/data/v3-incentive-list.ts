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
  '0xeec6459eb0d7379623c6b1d8b323cc64dea67f43e6ca85e8909a27424d21e812': {
    rewardToken: '0x71e26d0e519d14591b9de9a0fe9513a398101490',
    pool: '0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19',
    startTime: 1725104100,
    lockTime: 0,
    minimumTickRange: 0,
    maxTickLower: MAX_TICK,
    minTickLower: MIN_TICK,
    maxTickUpper: MAX_TICK,
    minTickUpper: MIN_TICK,
  },
  '0x3b85446788d259ca857dbb337cdb9ba3557a7fe0ab296ee405b8d2fd51d2500d': {
    rewardToken: '0x471ece3750da237f93b8e339c536989b8978a438',
    pool: '0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19',
    startTime: 1725105600,
    lockTime: 0,
    minimumTickRange: 0,
    maxTickLower: MAX_TICK,
    minTickLower: MIN_TICK,
    maxTickUpper: MAX_TICK,
    minTickUpper: MIN_TICK,
  },
}
const incentiveIds: string[] = [
  '0xeec6459eb0d7379623c6b1d8b323cc64dea67f43e6ca85e8909a27424d21e812',
  '0x3b85446788d259ca857dbb337cdb9ba3557a7fe0ab296ee405b8d2fd51d2500d',
]

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
