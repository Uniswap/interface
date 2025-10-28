import type { FeatureFlags } from '@universe/gating'
import type { AppTFunction } from 'ui/src/i18n/types'
import type { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'

export enum TransactionSettingId {
  SLIPPAGE = 'slippage',
  DEADLINE = 'deadline',
}

export type TransactionSettingConfig = {
  renderTitle: (t: AppTFunction) => string
  hideTitle?: boolean
  Description?: React.FunctionComponent
  /** Array of platforms where this setting is applicable. */
  applicablePlatforms: Platform[]
  /** The UI that is displayed on the right side of a settings row, e.g. a Switch. If `Screen` is also defined, pressing `Control` will navigate to the screen. */
  Control: React.FunctionComponent
  /** The UI that will render if `Control` is pressed. */
  Screen?: React.FunctionComponent
  /** If defined, an info icon will appear next to `Title`, that will open `InfoModal` on press. */
  InfoModal?: React.FunctionComponent<{ isOpen: boolean; onClose: () => void }>
  /** If defined and the `featureFlag` is disabled, this setting will not be displayed. */
  featureFlag?: FeatureFlags
  settingId?: TransactionSettingId
  renderTooltip?: (t: AppTFunction) => string
  /** Returns warning configuration if the setting should show a warning */
  Warning?: React.FunctionComponent
}

export interface TransactionSettingsState {
  customSlippageTolerance?: number
  customDeadline?: number
  selectedProtocols: FrontendSupportedProtocol[]
  slippageWarningModalSeen: boolean
  isV4HookPoolsEnabled: boolean
}

export type TransactionSettings = TransactionSettingsState & { autoSlippageTolerance?: number }
