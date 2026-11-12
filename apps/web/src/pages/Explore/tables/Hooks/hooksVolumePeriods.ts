import { TimePeriod } from '~/data/util'
import type { HookVolumePeriod } from '~/features/Hooks/types'

export const HOOK_VOLUME_PERIODS = [TimePeriod.DAY, TimePeriod.WEEK, TimePeriod.MONTH] as const

type HookTimePeriod = (typeof HOOK_VOLUME_PERIODS)[number]

const HOOK_VOLUME_PERIOD_KEYS: Record<HookTimePeriod, HookVolumePeriod> = {
  [TimePeriod.DAY]: '1d',
  [TimePeriod.WEEK]: '7d',
  [TimePeriod.MONTH]: '30d',
}

export function getHookVolumePeriod(period: HookTimePeriod): HookVolumePeriod {
  return HOOK_VOLUME_PERIOD_KEYS[period]
}
