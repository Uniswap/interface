import type { UsePlatformBasedValue } from 'uniswap/src/utils/usePlatformBasedValue'

export function usePlatformBasedValue<T>({ defaultValue, mobile }: UsePlatformBasedValue<T>): T {
  return mobile?.defaultValue ?? defaultValue
}
