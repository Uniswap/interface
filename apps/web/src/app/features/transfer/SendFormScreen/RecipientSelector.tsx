import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'

export function RecipientSelector(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex grow row alignItems="center" gap="$spacing12">
      <Flex>
        <Text variant="body2">{t('To')}</Text>
      </Flex>

      <Flex fill>Recipient Input</Flex>
    </Flex>
  )
}
