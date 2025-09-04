import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { DeadlineControl } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/DeadlineControl'
import { DeadlineWarning } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/DeadlineWarning'
import {
  type TransactionSettingConfig,
  TransactionSettingId,
} from 'uniswap/src/features/transactions/components/settings/types'

/**
 * Note: This setting has its title overridden in the Web Swap flow
 * See {@link file:apps/web/src/pages/Swap/settings/DeadlineOverride.tsx}
 * If further overrides are needed, consider moving to a factory function
 */

export const Deadline: TransactionSettingConfig = {
  settingId: TransactionSettingId.DEADLINE,
  applicablePlatforms: [Platform.EVM],
  renderTitle: (t) => t('swap.deadline.settings.title.short'),
  renderTooltip: (t) => t('swap.settings.deadline.tooltip'),
  Control() {
    return <DeadlineControl />
  },
  Warning() {
    return <DeadlineWarning />
  },
}
