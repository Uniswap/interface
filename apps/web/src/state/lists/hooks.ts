import { useAppSelector } from 'state/hooks'
import { InterfaceState } from 'state/webReducer'

export function useAllLists(): InterfaceState['lists']['byUrl'] {
  return useAppSelector((state) => state.lists.byUrl)
}
