// TODO(WALL-6098): this is a temporary solution until the delay typing is updated
// thread: https://uniswapteam.slack.com/messages/C07AHFK2QRK/p1740698259468079
type DelayAnimationKey =
  | '200msDelayed1ms'
  | '200msDelayed40ms'
  | '200msDelayed80ms'
  | '200msDelayed120ms'
  | '200msDelayed160ms'
  | '200msDelayed200ms'
  | '200msDelayed240ms'
// maintain alignment with `DelayAnimationKey`
const DELAY_VALUES = [1, 40, 80, 120, 160, 200, 240] as const
const DEFAULT_ANIMATION_DELAY: (typeof DELAY_VALUES)[number] = 1
export const getDelayValue = (delay: number): DelayAnimationKey => `200msDelayed${delay}ms` as DelayAnimationKey
export const delayAnimations200ms: Record<
  DelayAnimationKey,
  {
    type: 'spring'
    delay: number
    stiff: 150
    damping: 30
  }
> = {
  // needs to be one-to-one with DelayAnimationKey
  ...DELAY_VALUES.reduce(
    (acc, delay) => {
      acc[getDelayValue(delay)] = {
        type: 'spring',
        stiff: 150,
        damping: 30,
        delay,
        duration: 200,
      }
      return acc
    },
    {} as Record<
      DelayAnimationKey,
      {
        type: 'spring'
        stiff: 150
        damping: 30
        delay: number
        duration: 200
      }
    >,
  ),
}
export const get200MsAnimationDelayFromIndex = (index: number): DelayAnimationKey => {
  return getDelayValue(DELAY_VALUES[index] || DEFAULT_ANIMATION_DELAY)
}
