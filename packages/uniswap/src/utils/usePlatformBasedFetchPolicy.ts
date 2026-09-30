import { usePlatformBasedValue } from 'uniswap/src/utils/usePlatformBasedValue'

export type FetchPolicy = 'cache-first' | 'network-only' | 'cache-only' | 'no-cache' | 'standby' | 'cache-and-network'

type Props = {
  fetchPolicy: FetchPolicy | undefined
  pollInterval: number | undefined
}

export function usePlatformBasedFetchPolicy(props: Props): Props {
  return usePlatformBasedValue<Props>({
    defaultValue: props,
    extension: {
      windowNotFocused: {
        fetchPolicy: 'cache-only',
        pollInterval: 0,
      },
    },
  })
}
