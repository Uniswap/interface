import { useAppSelector } from 'state/hooks'

import { AppState } from '../index'

export function useXttPresaleState(): AppState['xttPresale'] {
  return useAppSelector((state) => state.xttPresale)
}

export function useXttPresaleStateStatus(): AppState['xttPresale']['status'] {
  return useAppSelector((state) => state.xttPresale.status)
}
export function useXttPresaleStateStatusWithSigner(): AppState['xttPresale']['statusWithSigner'] {
  return useAppSelector((state) => state.xttPresale.statusWithSigner)
}
