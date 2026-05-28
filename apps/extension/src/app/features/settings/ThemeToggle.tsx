import { useTranslation } from 'react-i18next'
import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { Flex, Text } from 'ui/src'
import { Contrast } from 'ui/src/components/icons'
import { ThemeToggle } from 'uniswap/src/components/appearance/ThemeToggle'

export function ThemeToggleWithLabel(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="$spacing16"
      justifyContent="space-between"
      px={SCREEN_ITEM_HORIZONTAL_PAD}
      py="$spacing4"
    >
      <Flex row gap="$spacing12">
        <Contrast color="$neutral2" size="$icon.24" />
        <Text>{t('settings.setting.appearance.title')}</Text>
      </Flex>
      <Flex>
        <ThemeToggle />
      </Flex>
    </Flex>
  )
}
