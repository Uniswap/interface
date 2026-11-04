import { Platform } from '@universe/chains'
import { Switch } from '@universe/mycelium'
import { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { useOneClickSwapSetting } from '~/state/oneClickSwap/hooks'

export const OneClickSwap: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.settings.oneClickSwap.title'),
  renderTooltip: (t) => t('swap.settings.oneClickSwap.tooltip'),
  applicablePlatforms: [Platform.EVM],
  Control() {
    const oneClickSwapSetting = useOneClickSwapSetting()
    return (
      <Switch checked={oneClickSwapSetting.enabled} variant="branded" onCheckedChange={oneClickSwapSetting.toggle} />
    )
  },
}
