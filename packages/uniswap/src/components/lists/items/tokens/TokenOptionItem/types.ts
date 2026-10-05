import type { ModifierPressProps } from '@universe/mycelium'
import type { FocusedRowControl, OptionItemProps } from 'uniswap/src/components/lists/items/OptionItem'
import type { TokenOption } from 'uniswap/src/components/lists/items/types'
import type { CurrencyInfo, SearchTokenStats } from 'uniswap/src/features/dataApi/types'
import type { RWAIssuer } from 'uniswap/src/features/rwa/types'
import type { CategoryTagPlacement } from 'uniswap/src/features/tokenCategories/CategoryTagPill'

export enum TokenContextMenuVariant {
  Search = 'search',
  TokenSelector = 'tokenSelector',
}

// @deprecated
export interface LegacyTokenOptionItemProps {
  option: TokenOption
  showWarnings: boolean
  onPress: () => void
  showTokenAddress?: boolean
  tokenWarningDismissed: boolean
  quantity: number | null
  // TODO(WEB-4731): Remove isKeyboardOpen dependency
  isKeyboardOpen?: boolean
  // TODO(WEB-3643): Share localization context with WEB
  // (balance, quantityFormatted)
  balance: string
  quantityFormatted?: string
  isSelected?: boolean
}

export interface MultichainData {
  tokens: CurrencyInfo[]
  primaryCurrencyInfo: CurrencyInfo
}

export interface TokenOptionItemProps extends ModifierPressProps {
  option: TokenOption
  onPress: () => void
  showTokenAddress?: boolean
  networkCount?: number
  hideNetworkCount?: boolean
  hideNetworkLogo?: boolean
  rightElement?: JSX.Element
  categoryTag?: OptionItemProps['categoryTag']
  categoryTagPlacement?: CategoryTagPlacement
  showDisabled?: boolean
  modalInfo?: OptionItemProps['modalInfo']
  focusedRowControl?: FocusedRowControl
  contextMenuVariant: TokenContextMenuVariant
  /** When provided on native, "Copy address" opens a multichain address bottom sheet. */
  multichainData?: MultichainData
  /** Canonical name override for multichain tokens, used instead of currency.name (which may be chain-specific for native tokens). */
  displayName?: string
  issuer?: RWAIssuer
  showIssuerTag?: boolean
  searchStats?: SearchTokenStats
  /** Search V2: best Earn vault APY for this token; shown in place of the symbol when present. */
  earnApyPercent?: number
  hideContextMenu?: boolean
  symbolMaxCharacters?: number
}

export function isLegacyTokenOptionItemProps(
  props: TokenOptionItemProps | LegacyTokenOptionItemProps,
): props is LegacyTokenOptionItemProps {
  return 'balance' in props
}
