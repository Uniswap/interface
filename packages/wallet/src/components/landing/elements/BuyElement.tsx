import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Buy } from 'ui/src/components/icons'
import { colors, opacify } from 'ui/src/theme'

export const BuyElement = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex
      centered
      row
      borderRadius="$roundedFull"
      gap="$spacing4"
      px="$spacing12"
      py="$spacing8"
      style={{ backgroundColor: opacify(20, colors.orange200) }}
      transform={[{ rotateZ: '-1deg' }]}
    >
      <Buy color="$orange300" size="$icon.20" />
      <Text color="$orange300" textAlign="center" variant="buttonLabel3">
        {t('common.button.buy')}
      </Text>
    </Flex>
  )
}
