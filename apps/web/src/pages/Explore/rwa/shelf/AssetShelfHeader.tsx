import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, TouchableArea } from 'ui/src'

const NewBadge = styled(Text, {
  variant: 'body4',
  color: '$accent1',
  backgroundColor: '$accent2',
  px: '$spacing6',
  py: '$spacing2',
  borderRadius: '$rounded8',
})

export function AssetShelfHeader({ onViewAll }: { onViewAll: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center" gap="$spacing8">
        <Text variant="subheading1" color="$neutral1">
          {t('common.stocks')}
        </Text>
        <NewBadge>{t('common.new')}</NewBadge>
      </Flex>
      <TouchableArea onPress={onViewAll}>
        <Text variant="buttonLabel3" color="$neutral2">
          {t('common.viewAll')}
        </Text>
      </TouchableArea>
    </Flex>
  )
}
