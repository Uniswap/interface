// TODO(WALL-6098): this is a temporary solution until the delay typing is updated
// thread: https://uniswapteam.slack.com/messages/C07AHFK2QRK/p1740698259468079
type DelayAnimationKey =
  | '200msDelayed50ms'
  | '200msDelayed100ms'
  | '200msDelayed150ms'
  | '200msDelayed200ms'
  | '200msDelayed250ms'
  | '200msDelayed300ms'
  | '200msDelayed350ms'
// maintain alignment with `DelayAnimationKey`
const DELAY_VALUES = [50, 100, 150, 200, 250, 300, 350] as const
const DEFAULT_ANIMATION_DELAY: (typeof DELAY_VALUES)[number] = 350
export const getDelayValue = (delay: number): DelayAnimationKey => `200msDelayed${delay}ms` as DelayAnimationKey
export const delayAnimations200ms: Record<
  DelayAnimationKey,
  {
    type: 'timing'
    delay: number
    duration: 200
  }
> = {
  // needs to be one-to-one with DelayAnimationKey
  ...DELAY_VALUES.reduce(
    (acc, delay) => {
      acc[getDelayValue(delay)] = {
        type: 'timing',
        delay,
        duration: 200,
      }
      return acc
    },
    {} as Record<
      DelayAnimationKey,
      {
        type: 'timing'
        delay: number
        duration: 200
      }
    >,
  ),
}
export const get200MsAnimationDelayFromIndex = (index: number): DelayAnimationKey => {
  return getDelayValue(DELAY_VALUES[index] || DEFAULT_ANIMATION_DELAY)
}
