import { useAppSelector } from 'state/hooks'

export function useStateRehydrated() {
  return useAppSelector((state) => state._persist.rehydrated)
}
