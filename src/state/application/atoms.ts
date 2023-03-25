import { atomWithStorage, createJSONStorage } from 'jotai/utils'

const storage = createJSONStorage(() => sessionStorage)

export const shouldDisableNFTRoutesAtom = atomWithStorage('shouldDisableNFTRoutes', false, storage)
