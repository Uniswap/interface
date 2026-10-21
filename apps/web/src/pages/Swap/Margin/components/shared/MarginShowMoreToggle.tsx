import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Separator } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'

// Centered divider toggle (design): Separator — "Show more/less ⌄" — Separator. Collapses/expands the
// modals' detail rows.
export function MarginShowMoreToggle({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean
  onToggle: () => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" gap="$spacing12">
      <Separator style={{ flex: 1 }} />
      <TouchableArea onPress={onToggle} aria-expanded={isExpanded}>
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="buttonLabel3" color="$neutral2">
            {isExpanded ? t('common.button.showLess') : t('common.button.showMore')}
          </Text>
          <RotatableChevron direction={isExpanded ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
        </Flex>
      </TouchableArea>
      <Separator style={{ flex: 1 }} />
    </Flex>
  )
}
