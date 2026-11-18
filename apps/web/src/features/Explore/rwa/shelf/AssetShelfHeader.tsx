import { Flex, Text, TouchableArea } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Shelf section header: title (plus optional badge/adornment) on the left, "View all" on the right. */
export function AssetShelfHeader({
  title,
  badge,
  onViewAll,
}: {
  title: string
  badge?: ReactNode
  onViewAll: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center" gap="$spacing8">
        <Text variant="subheading1" color="$neutral1">
          {title}
        </Text>
        {badge}
      </Flex>
      <TouchableArea onPress={onViewAll}>
        <Text variant="buttonLabel3" color="$neutral2">
          {t('common.viewAll')}
        </Text>
      </TouchableArea>
    </Flex>
  )
}
