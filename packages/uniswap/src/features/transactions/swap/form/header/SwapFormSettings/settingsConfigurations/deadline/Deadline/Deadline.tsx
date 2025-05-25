import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Deadline: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.deadline.settings.title.short'),
  Control() {
    throw new PlatformSplitStubError('Deadline')
  },
}
