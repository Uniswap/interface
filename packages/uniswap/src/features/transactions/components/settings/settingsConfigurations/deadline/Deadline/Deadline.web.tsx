import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { DeadlineControl } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/DeadlineControl'
import { DeadlineWarning } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/DeadlineWarning'
import {
  type TransactionSettingConfig,
  TransactionSettingId,
} from 'uniswap/src/features/transactions/components/settings/types'

export const Deadline: TransactionSettingConfig = {
  settingId: TransactionSettingId.DEADLINE,
  applicablePlatforms: [Platform.EVM],
  renderTitle: (t) => t('swap.deadline.settings.title.short'),
  renderTooltip: (t) => t('swap.settings.deadline.tooltip'),
  tooltipLearnMoreUrl: UniswapHelpUrls.articles.swapDeadline,
  Control() {
    return <DeadlineControl />
  },
  Warning() {
    return <DeadlineWarning />
  },
}
