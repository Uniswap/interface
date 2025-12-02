import React from 'react'

const createAssetModuleMock = (filename: string) => {
  const staticPath = `/static/${filename}`
  const extension = filename.split('.').pop()
  if (extension === 'svg') {
    const MockedSvgComponent = React.forwardRef(({ children, ..._props }: any, ref: any) => {
      return React.createElement('svg', { ref, 'data-testid': 'mocked-svg' }, children)
    })
    MockedSvgComponent.displayName = 'MockedSvgComponent'

    return {
      ReactComponent: MockedSvgComponent,
      default: staticPath,
    }
  }

  if (extension && ['json'].includes(extension)) {
    return { default: {} }
  }

  return { default: staticPath }
}

vi.mock('ui/src/assets/backgrounds/for-connecting-v2.svg', () => createAssetModuleMock('svg'))
vi.mock('ui/src/assets/logos/png/polygon-logo.png', () => createAssetModuleMock('png'))
vi.mock('ui/src/assets/logos/png/uniswap-logo.png', () => createAssetModuleMock('png'))
vi.mock('ui/src/assets/logos/png/arbitrum-logo.png', () => createAssetModuleMock('png'))
vi.mock('ui/src/assets/logos/png/eth-logo.png', () => createAssetModuleMock('png'))
vi.mock('ui/src/assets/logos/png/ethereum-logo.png', () => createAssetModuleMock('png'))
vi.mock('ui/src/assets/graphics/unitag-light-small.png', () => createAssetModuleMock('png'))
vi.mock('ui/src/assets/logos/png/uniswap-logo-large.png', () => createAssetModuleMock('png'))
vi.mock('assets/images/dropdown.svg', () => createAssetModuleMock('svg'))
vi.mock('assets/svg/search.svg', () => createAssetModuleMock('svg'))
vi.mock('assets/svg/expando-icon-closed.svg', () => createAssetModuleMock('svg'))
vi.mock('assets/svg/expando-icon-opened.svg', () => createAssetModuleMock('svg'))

vi.mock('ui/src/components/Unicon', () => ({
  Unicon: ({ ..._props }: any) => {
    return React.createElement('span', { 'data-testid': 'unicon' }, '🔵')
  },
}))

vi.mock('ui/src/assets', () => ({
  ALL_NETWORKS_LOGO: 'all-networks-logo.png',
  ETHEREUM_LOGO: 'ethereum-logo.png',
  OPTIMISM_LOGO: 'optimism-logo.png',
  ARBITRUM_LOGO: 'arbitrum-logo.png',
  BASE_LOGO: 'base-logo.png',
  BNB_LOGO: 'bnb-logo.png',
  MONAD_LOGO_FILLED: 'monad-logo-filled.png',
  POLYGON_LOGO: 'polygon-logo.png',
  BLAST_LOGO: 'blast-logo.png',
  AVALANCHE_LOGO: 'avalanche-logo.png',
  CELO_LOGO: 'celo-logo.png',
  WORLD_CHAIN_LOGO: 'world-chain-logo.png',
  ZORA_LOGO: 'zora-logo.png',
  ZKSYNC_LOGO: 'zksync-logo.png',
  SOLANA_LOGO: 'solana-logo.png',
  SONEIUM_LOGO: 'soneium-logo.png',
  UNICHAIN_LOGO: 'unichain-logo.png',
  UNICHAIN_SEPOLIA_LOGO: 'unichain-sepolia-logo.png',
  UNISWAP_LOGO: 'uniswap-logo.png',
  UNISWAP_LOGO_LARGE: 'uniswap-logo-large.png',
  UNISWAP_MONO_LOGO_LARGE: 'uniswap-mono-logo-large.png',
  UNISWAP_APP_ICON: 'uniswap-app-icon.png',
  ONBOARDING_QR_ETCHING_VIDEO_LIGHT: 'light-etching.mp4',
  ONBOARDING_QR_ETCHING_VIDEO_DARK: 'dark-etching.mp4',
  AVATARS_LIGHT: 'avatars-light.png',
  AVATARS_DARK: 'avatars-dark.png',
  APP_SCREENSHOT_LIGHT: 'app-screenshot-light.png',
  APP_SCREENSHOT_DARK: 'app-screenshot-dark.png',
  DOT_GRID: 'dot-grid.png',
  UNITAGS_BANNER_VERTICAL_LIGHT: 'unitags-banner-v-light.png',
  UNITAGS_BANNER_VERTICAL_DARK: 'unitags-banner-v-dark.png',
  UNITAGS_INTRO_BANNER_LIGHT: 'unitags-intro-banner-light.png',
  UNITAGS_INTRO_BANNER_DARK: 'unitags-intro-banner-dark.png',
  BRIDGING_BANNER: 'bridging-banner.png',
  DAI_LOGO: 'dai-logo.png',
  USDC_LOGO: 'usdc-logo.png',
  ETH_LOGO: 'eth-logo.png',
  OPENSEA_LOGO: 'opensea-logo.png',
  ENS_LOGO: 'ens-logo.png',
  FROGGY: 'froggy.png',
  CEX_TRANSFER_MODAL_BG_LIGHT: 'cex-transfer-modal-bg-light.png',
  CEX_TRANSFER_MODAL_BG_DARK: 'cex-transfer-modal-bg-dark.png',
  UNITAG_DARK: 'unitag-dark.png',
  UNITAG_LIGHT: 'unitag-light.png',
  UNITAG_DARK_SMALL: 'unitag-dark-small.png',
  UNITAG_LIGHT_SMALL: 'unitag-light-small.png',
  PUSH_NOTIFICATIONS_CARD_BANNER: 'push-notifications-card-banner.png',
  ONBOARDING_NOTIFICATIONS_DARK: 'onboarding-notifications-dark.png',
  ONBOARDING_NOTIFICATIONS_LIGHT: 'onboarding-notifications-light.png',
  FOR_CONNECTING_BACKGROUND_DARK: 'for-connecting-background-dark.png',
  FOR_CONNECTING_BACKGROUND_LIGHT: 'for-connecting-background-light.png',
  CRYPTO_PURCHASE_BACKGROUND_LIGHT: 'crypto-purchase-background-light.png',
  CRYPTO_PURCHASE_BACKGROUND_DARK: 'crypto-purchase-background-dark.png',
  SECURITY_SCREEN_BACKGROUND_DARK: 'security-screen-background-dark.png',
  SECURITY_SCREEN_BACKGROUND_LIGHT: 'security-screen-background-light.png',
  DEAD_LUNI: 'dead-luni.png',
  PASSKEY_ICON: 'passkey.svg',
  UNITAGS_ADRIAN_LIGHT: 'unitags-adrian-light.png',
  UNITAGS_ADRIAN_DARK: 'unitags-adrian-dark.png',
  UNITAGS_ANDREW_LIGHT: 'unitags-andrew-light.png',
  UNITAGS_ANDREW_DARK: 'unitags-andrew-dark.png',
  UNITAGS_BRYAN_LIGHT: 'unitags-bryan-light.png',
  UNITAGS_BRYAN_DARK: 'unitags-bryan-dark.png',
  UNITAGS_CALLIL_LIGHT: 'unitags-callil-light.png',
  UNITAGS_CALLIL_DARK: 'unitags-callil-dark.png',
  UNITAGS_FRED_LIGHT: 'unitags-fred-light.png',
  UNITAGS_FRED_DARK: 'unitags-fred-dark.png',
  UNITAGS_MAGGIE_LIGHT: 'unitags-maggie-light.png',
  UNITAGS_MAGGIE_DARK: 'unitags-maggie-dark.png',
  UNITAGS_PHIL_LIGHT: 'unitags-phil-light.png',
  UNITAGS_PHIL_DARK: 'unitags-phil-dark.png',
  UNITAGS_SPENCER_LIGHT: 'unitags-spencer-light.png',
  UNITAGS_SPENCER_DARK: 'unitags-spencer-dark.png',
  SMART_WALLET_UPGRADE_VIDEO: 'smart-wallet-upgrade-video.mp4',
  SMART_WALLET_UPGRADE_FALLBACK: 'smart-wallet-upgrade-fallback.png',
}))

// Add more asset mocks as needed
// This ensures all asset imports resolve to consistent static paths.
