// eslint-disable-next-line no-restricted-imports -- TODO: Investigate why crossPlatform settings is not allowing this import
import { NetInfoStateType } from '@react-native-community/netinfo'
import { isOffline } from 'utilities/src/connection/useIsOffline'

const networkUnknown = {
  isConnected: null,
  type: NetInfoStateType.unknown,
  isInternetReachable: null,
  details: null,
} as const

const networkDown = {
  isConnected: false,
  type: NetInfoStateType.none,
  isInternetReachable: false,
  details: null,
} as const

const networkUp = {
  isConnected: true,
  type: NetInfoStateType.other,
  isInternetReachable: true,
  details: { isConnectionExpensive: false },
} as const

describe(isOffline, () => {
  it('returns true when network is connected', () => {
    expect(isOffline(networkUp)).toBeFalsy()
  })

  it('returns true if there is no connection', () => {
    expect(isOffline(networkDown)).toBeTruthy()
  })

  it('returns false when network state is unknown', () => {
    expect(isOffline(networkUnknown)).toBeFalsy()
  })
})
