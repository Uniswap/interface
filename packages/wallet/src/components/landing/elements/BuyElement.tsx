import { useTranslation } from 'react-i18next'
import { Flex, Text, useIsDarkMode } from 'ui/src'
import { Buy } from 'ui/src/components/icons'
import { colors, opacify } from 'ui/src/theme'

export const BuyElement = (): JSX.Element => {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const mainColor = isDarkMode ? '$orange500' : '$orange300'

  return (
    <Flex
      centered
      row
      borderRadius="$roundedFull"
      gap="$spacing4"
      px="$spacing12"
      py="$spacing8"
      style={{ backgroundColor: opacify(isDarkMode ? 10 : 20, colors.orange200) }}
      transform={[{ rotateZ: '-1deg' }]}
    >
      <Buy color={mainColor} size="$icon.20" />
      <Text color={mainColor} textAlign="center" variant="buttonLabel3">
        {t('common.button.buy')}
      </Text>
    </Flex>
  )
}
