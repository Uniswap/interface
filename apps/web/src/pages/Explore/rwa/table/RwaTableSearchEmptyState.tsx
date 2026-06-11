import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'

export function RwaTableSearchEmptyState(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Text variant="body2" color="$neutral2" py="$spacing20" textAlign="center">
      {t('common.noResults')}
    </Text>
  )
}
