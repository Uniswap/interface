import { atomWithStorage, createJSONStorage } from 'jotai/utils'

// note: consider a generic sessionStorage abstraction if this pattern becomes common.
// i.e., for future promo dismissals like the tax serivice discounts or FoR launch notif
const storage = createJSONStorage(() => sessionStorage)

// some dapp browsers need to be able to disable the NFT portion of the app in order to pass Apple's app store review
// this atom persists the inclusion of the `disableNFTs=boolean` query parameter via the webview's session storage
export const shouldDisableNFTRoutesAtom = atomWithStorage('shouldDisableNFTRoutes', false, storage)
