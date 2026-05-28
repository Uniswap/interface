import type { EdgeInsets } from 'react-native-safe-area-context'

export function useDeviceInsets(): EdgeInsets {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }
}
