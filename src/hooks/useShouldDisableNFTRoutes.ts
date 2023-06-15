import { useAtomValue } from 'jotai/utils'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'

export function useShouldDisableNFTRoutes() {
  return useAtomValue(shouldDisableNFTRoutesAtom)
}
