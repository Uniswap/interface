import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SlippageControl } from 'uniswap/src/features/transactions/swap/settings/SlippageControl'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'

export const SlippageUpdate: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  renderCloseButtonText: (t) => t('common.button.save'),
  hideTitle: true,
  Control() {
    return <></>
  },
  Screen() {
    const { t } = useTranslation()
    return (
      <Flex gap="$spacing16" width="100%">
        <Flex row alignItems="center" justifyContent="space-between" py="$spacing16">
          <Text variant="body2">{t('swap.slippage.settings.title')}</Text>
          <SlippageControl saveOnBlur={true} />
        </Flex>
      </Flex>
    )
  },
}
