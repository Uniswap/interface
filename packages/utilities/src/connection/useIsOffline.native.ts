import { NetInfoState, useNetInfo } from '@react-native-community/netinfo'

export function isOffline(networkStatus: NetInfoState): boolean {
  return (
    networkStatus.type !== 'unknown' &&
    typeof networkStatus.isInternetReachable === 'boolean' &&
    networkStatus.isConnected === false
  )
}

export function useIsOffline(): boolean {
  // First `useNetInfo` call always results with unknown state,
  // which we want to ignore here until state is determined,
  // otherwise it leads to immediate re-renders of views dependent on useTransferWarnings.
  //
  // See for more here: https://github.com/react-native-netinfo/react-native-netinfo/pull/444

  return isOffline(useNetInfo())
}
