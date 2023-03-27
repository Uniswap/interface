import { atomWithStorage, createJSONStorage } from 'jotai/utils'

/*
  note: 
  We should consider a generic sessionStorage abstraction if this pattern becomes common. (i.e., for future promo dismissals like the tax service discounts or FoR launch notification)
  This would be something similar to the current feature flag implementation, but utilizing session instead

  motivation:
  some dapp browsers need to be able to disable the NFT portion of the app in order to pass Apple's app store review
  this atom persists the inclusion of the `disableNFTs=boolean` query parameter via the webview's session storage
*/
const storage = createJSONStorage(() => sessionStorage)

export const shouldDisableNFTRoutesAtom = atomWithStorage('shouldDisableNFTRoutes', false, storage)
