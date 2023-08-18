import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'

export function RecipientSelector(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex grow row alignItems="center" gap="$spacing12">
      <Flex>
        <Text variant="bodySmall">{t('To')}</Text>
      </Flex>

      <Flex flex={1}>Recipient Input</Flex>
    </Flex>
  )
}
