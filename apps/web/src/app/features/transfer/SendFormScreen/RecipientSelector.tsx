import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { Flex } from 'ui/src/components/layout'

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
