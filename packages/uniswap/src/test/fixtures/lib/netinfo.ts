// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  NetInfoConnectedStates,
  NetInfoNoConnectionState,
  NetInfoStateType,
  NetInfoUnknownState,
} from '@react-native-community/netinfo'
import { createFixture } from 'uniswap/src/test/utils'

export const networkUnknown = createFixture<NetInfoUnknownState>()(() => ({
  isConnected: null,
  type: NetInfoStateType.unknown,
  isInternetReachable: null,
  details: null,
}))

export const networkDown = createFixture<NetInfoNoConnectionState>()(() => ({
  isConnected: false,
  type: NetInfoStateType.none,
  isInternetReachable: false,
  details: null,
}))

export const networkUp = createFixture<NetInfoConnectedStates>()(() => ({
  isConnected: true,
  type: NetInfoStateType.other,
  isInternetReachable: true,
  details: { isConnectionExpensive: false },
}))
