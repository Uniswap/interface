import { atomWithStorage, createJSONStorage } from 'jotai/utils'

/*
  Note: 
  We should consider a generic sessionStorage abstraction if this pattern becomes common. (i.e., Future promo dismissals like the tax service discounts or Fiat Onramp launch notification may use this.)
  This would be something similar to the current feature flag implementation, but utilizing session instead

  Motivation:
  some dapp browsers need to be able to disable the NFT portion of the app in order to pass Apple's app store review
  this atom persists the inclusion of the `disableNFTs=boolean` query parameter via the webview's session storage
*/
const storage = createJSONStorage(() => sessionStorage)

export const shouldDisableNFTRoutesAtom = atomWithStorage('shouldDisableNFTRoutes', false, storage)
