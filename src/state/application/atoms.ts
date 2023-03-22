import { atomWithStorage } from 'jotai/utils'

export const shouldDisableNFTRoutesAtom = atomWithStorage<boolean>('shouldDisableNFTRoutes', false)
