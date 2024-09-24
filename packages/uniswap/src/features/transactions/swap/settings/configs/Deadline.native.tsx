import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { NotImplementedError } from 'utilities/src/errors'

export const Deadline: SwapSettingConfig = {
  renderTitle: () => {
    throw new NotImplementedError('Deadline > renderTitle')
  },
  Control() {
    throw new NotImplementedError('Deadline > Control')
  },
}
