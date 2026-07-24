import type { EarnPositionInfo, EarnVaultInfo, EarnVaultTab } from 'uniswap/src/features/earn/types'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'

// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnVaultModalProps = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  vault?: EarnVaultInfo
  position?: EarnPositionInfo
  initialSelectedTab?: EarnVaultTab
  isInfoOnly?: boolean
}
