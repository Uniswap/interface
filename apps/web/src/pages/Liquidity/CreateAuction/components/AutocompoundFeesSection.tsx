import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text } from 'ui/src'

export function AutocompoundFeesSection({
  enabled,
  onEnabledChange,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="flex-start" justifyContent="space-between" gap="$spacing12">
      <Flex flex={1}>
        <Text variant="buttonLabel3" color="$neutral1" height={20} lineHeight={20}>
          {t('toucan.createAuction.step.customizePool.autocompoundFees')}
        </Text>
        <Text variant="body4" color="$neutral2">
          {t('toucan.createAuction.step.customizePool.autocompoundFees.description')}
        </Text>
      </Flex>
      <Switch checked={enabled} variant="default" onCheckedChange={onEnabledChange} />
    </Flex>
  )
}
