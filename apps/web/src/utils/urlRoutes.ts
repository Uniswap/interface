import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { CHROME_EXTENSION_UNINSTALL_URL_PATH } from 'uniswap/src/constants/urls'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

export function getCurrentPageFromLocation(locationPathname: string): InterfacePageName | undefined {
  switch (true) {
    case locationPathname === '/':
      return InterfacePageName.LandingPage
    case locationPathname.startsWith('/swap'):
      return InterfacePageName.SwapPage
    case locationPathname.startsWith('/portfolio/tokens'):
      return InterfacePageName.PortfolioTokensPage
    case locationPathname.startsWith('/portfolio/defi'):
      return InterfacePageName.PortfolioDefiPage
    case locationPathname.startsWith('/portfolio/nfts'):
      return InterfacePageName.PortfolioNftsPage
    case locationPathname.startsWith('/portfolio/activity'):
      return InterfacePageName.PortfolioActivityPage
    case locationPathname.startsWith('/portfolio'):
      return InterfacePageName.PortfolioPage
    case locationPathname.startsWith('/explore/tokens') &&
      (locationPathname.includes('0x') || locationPathname.includes(NATIVE_CHAIN_ID)):
      return InterfacePageName.TokenDetailsPage
    case locationPathname.startsWith('/explore/pools') && locationPathname.includes('0x'):
      return InterfacePageName.PoolDetailsPage
    case locationPathname.startsWith('/explore'):
      return InterfacePageName.ExplorePage
    case locationPathname.startsWith('/vote'):
      return InterfacePageName.VotePage
    case locationPathname.startsWith('/positions/v2'):
    case locationPathname.startsWith('/positions/v3'):
    case locationPathname.startsWith('/positions/v4'):
      return InterfacePageName.PoolDetailsPage
    case locationPathname.startsWith('/positions'):
    case locationPathname.startsWith('/pools'):
    case locationPathname.startsWith('/pool'):
    case locationPathname.startsWith('/add'):
    case locationPathname.startsWith('/remove'):
      return InterfacePageName.PoolPage
    case locationPathname.startsWith('/tokens'):
      return InterfacePageName.TokensPage
    case locationPathname.startsWith('/nfts/profile'):
      return InterfacePageName.NftProfilePage
    case locationPathname.startsWith('/nfts/asset'):
      return InterfacePageName.NftDetailsPage
    case locationPathname.startsWith('/nfts/collection'):
      return InterfacePageName.NftCollectionPage
    case locationPathname.startsWith('/nfts'):
      return InterfacePageName.NftExplorePage
    case locationPathname.startsWith(CHROME_EXTENSION_UNINSTALL_URL_PATH):
      return InterfacePageName.ExtensionUninstall
    default:
      return undefined
  }
}

export function getCanonicalUrl(locationPathName: string): string {
  const baseUrl = `${window.location.origin}${locationPathName}`
  const modifiedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return modifiedBaseUrl
}
