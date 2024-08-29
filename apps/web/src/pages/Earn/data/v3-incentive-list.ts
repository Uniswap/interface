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
  '0xe9fb3b6fbeca26b4a8fb14b74843cc27a99593102dc531376a85cb4e15b7d2ff': {
    rewardToken: '0x71e26d0e519d14591b9de9a0fe9513a398101490',
    pool: '0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19',
    startTime: 1724841568,
    lockTime: 0,
    minimumTickRange: 0,
    maxTickLower: MAX_TICK,
    minTickLower: MIN_TICK,
    maxTickUpper: MAX_TICK,
    minTickUpper: MIN_TICK,
  },
}
const incentiveIds: string[] = ['0xe9fb3b6fbeca26b4a8fb14b74843cc27a99593102dc531376a85cb4e15b7d2ff']

export function getAllIncentiveIds() {
  return incentiveIds
}

export function getIncentiveKey(inceniveId: string) {
  return incentiveKeys[inceniveId]
}
