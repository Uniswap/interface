import { navigationRef } from 'src/app/navigation/navigationRef'
import { store } from 'src/app/store'
import { MOBILE_NAV_PREFIX, UNITAG_NAV_PREFIX } from 'src/notification-service/data-sources/banners/types'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'
import { getLogger } from 'utilities/src/logger/logger'

/**
 * Chain name to UniverseChainId mapping for swap navigation
 */
const CHAIN_ID_MAP: Record<string, UniverseChainId> = {
  unichain: UniverseChainId.Unichain,
  mainnet: UniverseChainId.Mainnet,
  arbitrum: UniverseChainId.ArbitrumOne,
  optimism: UniverseChainId.Optimism,
  polygon: UniverseChainId.Polygon,
  base: UniverseChainId.Base,
  monad: UniverseChainId.Monad,
}

/**
 * Handles mobile:// protocol navigation
 */
function handleMobileNavigation(url: string, path: string): void {
  // Handle mobile://modal/{ModalName} pattern for direct modal navigation
  if (path.startsWith('modal/')) {
    const modalName = path.replace('modal/', '')
    // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
    navigationRef.navigate(modalName as any)
    return
  }

  // Handle mobile://swap pattern for swap navigation with flexible chain/currency pre-selection
  // Supported params:
  // - inputChain: Pre-fills INPUT with that chain's native token
  // - outputChain: Pre-fills OUTPUT with that chain's native token
  // - selectingField: Which field's token selector to open ('input' or 'output')
  // - selectingChain: Filter the token selector to this chain
  // Only specified params are applied - unspecified fields remain null/undefined
  // Matches getNavigateToSwapFlowArgsInitialState for NavigateToSwapFlowWithActions
  if (path.startsWith('swap')) {
    const urlObj = new URL(url)
    const inputChainParam = urlObj.searchParams.get('inputChain')
    const outputChainParam = urlObj.searchParams.get('outputChain')
    const selectingFieldParam = urlObj.searchParams.get('selectingField')
    const selectingChainParam = urlObj.searchParams.get('selectingChain')

    const inputChainId = inputChainParam ? CHAIN_ID_MAP[inputChainParam.toLowerCase()] : undefined
    const outputChainId = outputChainParam ? CHAIN_ID_MAP[outputChainParam.toLowerCase()] : undefined
    const selectingChainId = selectingChainParam ? CHAIN_ID_MAP[selectingChainParam.toLowerCase()] : undefined

    // Determine which field's selector to open (defaults to output if not specified)
    const selectingField = selectingFieldParam?.toLowerCase() === 'input' ? CurrencyField.INPUT : CurrencyField.OUTPUT

    // Build initial state - only set currencies for chains that were explicitly specified
    const initialState = {
      [CurrencyField.INPUT]: inputChainId
        ? {
            address: getNativeAddress(inputChainId),
            chainId: inputChainId,
            type: AssetType.Currency,
          }
        : null,
      [CurrencyField.OUTPUT]: outputChainId
        ? {
            address: getNativeAddress(outputChainId),
            chainId: outputChainId,
            type: AssetType.Currency,
          }
        : null,
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      selectingCurrencyField: selectingField,
      selectingCurrencyChainId: selectingChainId,
    }

    // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
    navigationRef.navigate(ModalName.Swap as any, initialState)
    return
  }

  // Handle mobile://explore pattern for explore with chain pre-selection
  if (path.startsWith('explore')) {
    const urlObj = new URL(url)
    const chainParam = urlObj.searchParams.get('chain')
    const chainId = chainParam ? CHAIN_ID_MAP[chainParam.toLowerCase()] : undefined

    // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
    navigationRef.navigate(ModalName.Explore as any, {
      screen: MobileScreens.Explore,
      params: { chainId },
    })
    return
  }

  // Handle mobile://backup pattern for backup flow navigation
  if (path === 'backup') {
    // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
    navigationRef.navigate(MobileScreens.OnboardingStack as any, {
      screen: OnboardingScreens.Backup,
      params: {
        importType: ImportType.BackupOnly,
        entryPoint: OnboardingEntryPoint.BackupCard,
      },
    })
    return
  }

  // Handle mobile://{Stack}/{Screen} pattern for stack navigation
  const parts = path.split('/').filter((p) => p.length > 0)

  // Navigate to the screen based on path segments
  // e.g., "SettingsStack/SettingsViewSeedPhrase" → navigate(SettingsStack, { screen: SettingsViewSeedPhrase })
  if (parts.length >= 2) {
    const [stack, screen] = parts
    // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
    const screenParams: any = { screen }
    // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
    navigationRef.navigate(stack as any, screenParams)
  } else if (parts.length === 1) {
    // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
    navigationRef.navigate(parts[0] as any)
  }
}

/**
 * Handles unitag:// protocol navigation for Unitag claim flow
 */
function handleUnitagNavigation(url: string, screen: string): void {
  const state = store.getState()
  const activeAddress = state.wallet.activeAccountAddress

  if (!activeAddress) {
    getLogger().warn(
      'handleNotificationNavigation',
      'handleUnitagNavigation',
      'No active address for unitag navigation',
      {
        url,
      },
    )
    return
  }

  if (screen !== UnitagScreens.ClaimUnitag) {
    getLogger().warn('handleNotificationNavigation', 'handleUnitagNavigation', 'Unknown unitag screen', { url, screen })
    return
  }

  // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
  const params: any = {
    screen: UnitagScreens.ClaimUnitag,
    params: {
      entryPoint: MobileScreens.Home,
      address: activeAddress,
    },
  }
  // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing for dynamic routes
  navigationRef.navigate(MobileScreens.UnitagStack as any, params)
}

/**
 * Handles navigation from notification clicks.
 *
 * Supported URL patterns:
 * - mobile://modal/{ModalName} - Direct modal navigation (e.g., FundWallet)
 * - mobile://swap?... - Swap modal with flexible pre-selection:
 *   - inputChain: Pre-fills INPUT with that chain's native token
 *   - outputChain: Pre-fills OUTPUT with that chain's native token
 *   - selectingField: Which token selector to open ('input' or 'output', defaults to 'output')
 *   - selectingChain: Filter the open token selector to this chain
 * - mobile://explore?chain={chain} - Explore screen with optional chain pre-selection
 * - mobile://backup - Backup flow navigation to "Choose your backup method" screen
 * - mobile://{Stack}/{Screen} - Stack navigation (e.g., SettingsStack/SettingsViewSeedPhrase)
 * - unitag://{screen} - Unitag claim flow
 * - https://... - External URLs opened in browser
 */
export function handleNotificationNavigation(url: string): void {
  // Ensure navigation is ready
  if (!navigationRef.isReady()) {
    getLogger().warn('handleNotificationNavigation', 'handleNotificationNavigation', 'Navigation not ready', { url })
    return
  }

  // Handle mobile:// protocol for internal navigation
  if (url.startsWith(MOBILE_NAV_PREFIX)) {
    const path = url.replace(MOBILE_NAV_PREFIX, '')
    handleMobileNavigation(url, path)
    return
  }

  // Handle unitag:// protocol for Unitag claim flow
  if (url.startsWith(UNITAG_NAV_PREFIX)) {
    const screen = url.replace(UNITAG_NAV_PREFIX, '')
    handleUnitagNavigation(url, screen)
    return
  }

  // All other URLs are external - open in browser
  openUri({ uri: url }).catch((error) => {
    getLogger().error(error, {
      tags: { file: 'handleNotificationNavigation', function: 'handleNotificationNavigation' },
      extra: { url },
    })
  })
}
