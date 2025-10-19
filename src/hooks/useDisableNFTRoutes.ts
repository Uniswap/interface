import { useAtomValue } from 'jotai'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'

export function useDisableNFTRoutes() {
  return useAtomValue(shouldDisableNFTRoutesAtom)
}
