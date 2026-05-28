import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Contrast } from 'ui/src/components/icons/Contrast'
import { ThemeToggle } from 'uniswap/src/components/appearance/ThemeToggle'

export function ThemeToggleWithLabel(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row gap="$gap4" alignItems="center" justifyContent="space-between">
      <Flex row gap="$gap12" alignItems="center">
        <Contrast size="$icon.24" color="$neutral2" />
        <Text variant="body3" color="$neutral1">
          {t('settings.setting.appearance.title')}
        </Text>
      </Flex>
      <ThemeToggle />
    </Flex>
  )
}
