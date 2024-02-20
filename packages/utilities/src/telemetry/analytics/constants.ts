import { SharedEventName, SwapEventName } from '@uniswap/analytics-events'

export const DUMMY_KEY = '00000000000000000000000000000000'

export const AMPLITUDE_SHARED_TRACKING_OPTIONS = {
  country: false,
  city: false,
  dma: false, // designated market area
  ipAddress: false,
  region: false,
}

export const AMPLITUDE_NATIVE_TRACKING_OPTIONS = {
  adid: false,
  carrier: false,
}

export const ANONYMOUS_EVENT_NAMES: string[] = [
  SharedEventName.ANALYTICS_SWITCH_TOGGLED.valueOf(),
  SharedEventName.HEARTBEAT.valueOf(),
  SwapEventName.SWAP_TRANSACTION_COMPLETED.valueOf(),
]
