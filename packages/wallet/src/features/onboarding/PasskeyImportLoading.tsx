import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export function PasskeyImportLoading({ pb }: { pb?: number }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered fill gap="$spacing40" pb={pb}>
      <SpinningLoader size={iconSizes.icon48} />
      <Flex centered gap="$spacing8">
        <Text color="$neutral1" variant="subheading1">
          {t('onboarding.passkey.loading.title')}
        </Text>
        <Text color="$neutral2" variant="subheading2">
          {t('onboarding.passkey.loading.subtitle')}
        </Text>
      </Flex>
    </Flex>
  )
}
