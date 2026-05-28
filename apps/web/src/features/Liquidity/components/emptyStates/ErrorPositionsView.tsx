import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

export function ErrorPositionsView({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        $platform-web={{
          textAlign: 'center',
        }}
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
          <AlertTriangleFilled size="$icon.24" color="$statusCritical" />
        </Flex>
        <Text variant="subheading1">{t('common.error.general')}</Text>
        <Text variant="body2" color="$neutral2" maxWidth={420}>
          {t('positions.error.loading')}
        </Text>
        <Button variant="default" size="small" onPress={onRetry}>
          {t('common.button.retry')}
        </Button>
      </Flex>
    </Flex>
  )
}
