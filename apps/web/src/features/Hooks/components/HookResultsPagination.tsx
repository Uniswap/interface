import { Button, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { noop } from 'utilities/src/react/noop'

export function HookResultsPagination({
  loading,
  disabled,
  error,
  onPress,
}: {
  loading: boolean
  disabled?: boolean
  error?: string
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap8" alignItems="center" role="status">
      {error && (
        <Text variant="body3" color="$neutral2">
          {error}
        </Text>
      )}
      <Button
        variant="default"
        emphasis="secondary"
        size="small"
        fill={false}
        disabled={loading || disabled}
        onDisabledPress={noop}
        onPress={onPress}
      >
        {loading ? t('common.loading') : t('common.button.retry')}
      </Button>
    </Flex>
  )
}
