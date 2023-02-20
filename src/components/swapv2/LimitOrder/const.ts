import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { LimitOrderStatus } from './type'

export const DEFAULT_EXPIRED = 7 * 86400

export const MIN_TIME_MINUTES = 5

const TIMES_IN_SECS = {
  ONE_DAY: 86400,
  ONE_HOUR: 3600,
  ONE_MIN: 60,
}

export const EXPIRED_OPTIONS = [
  // value in sec
  { label: `${MIN_TIME_MINUTES} Minutes`, value: MIN_TIME_MINUTES * TIMES_IN_SECS.ONE_MIN },
  { label: '10 Minutes', value: 10 * TIMES_IN_SECS.ONE_MIN },
  { label: '1 Hour', value: TIMES_IN_SECS.ONE_HOUR },
  { label: '3 Days', value: 3 * TIMES_IN_SECS.ONE_DAY },
  { label: '7 Days', value: 7 * TIMES_IN_SECS.ONE_DAY },
  { label: '30 Days', value: 30 * TIMES_IN_SECS.ONE_DAY },
]

export const ACTIVE_ORDER_OPTIONS = [
  {
    label: t`All Active Orders`,
    value: LimitOrderStatus.ACTIVE,
  },
  {
    label: t`Open Orders`,
    value: LimitOrderStatus.OPEN,
  },
  {
    label: t`Partially Filled Orders`,
    value: LimitOrderStatus.PARTIALLY_FILLED,
  },
]
export const CLOSE_ORDER_OPTIONS = [
  {
    label: t`All Closed Orders`,
    value: LimitOrderStatus.CLOSED,
  },
  {
    label: t`Filled Orders`,
    value: LimitOrderStatus.FILLED,
  },
  {
    label: t`Cancelled Orders`,
    value: LimitOrderStatus.CANCELLED,
  },
  {
    label: t`Expired Orders`,
    value: LimitOrderStatus.EXPIRED,
  },
]

export const GAS_AMOUNT_ETHEREUM = 1_200_000

const _USD_THRESHOLD: { [chainId: number]: number } = {
  [ChainId.MAINNET]: 300,
}
export const USD_THRESHOLD = new Proxy(_USD_THRESHOLD, {
  get(target, p) {
    const prop = p as any as ChainId
    if (p && target[prop]) return target[prop]
    return 10
  },
})
