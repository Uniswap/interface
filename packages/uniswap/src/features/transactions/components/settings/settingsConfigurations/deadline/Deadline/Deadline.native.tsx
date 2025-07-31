import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { NotImplementedError } from 'utilities/src/errors'

export const Deadline: TransactionSettingConfig = {
  renderTitle: () => {
    throw new NotImplementedError('Deadline > renderTitle')
  },
  Control() {
    throw new NotImplementedError('Deadline > Control')
  },
  Warning() {
    throw new NotImplementedError('Deadline > Warning')
  },
}
