import { WatchQueryFetchPolicy } from '@apollo/client'
import { usePlatformBasedValue } from 'uniswap/src/utils/usePlatformBasedValue'

type Props = {
  fetchPolicy: WatchQueryFetchPolicy | undefined
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
