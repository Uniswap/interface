import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { TripleDots } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

export function FavoriteHeaderRow({
  title,
  editingTitle,
  isEditing,
  onPress,
}: {
  title: string
  editingTitle: string
  isEditing: boolean
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing16"
      justifyContent="space-between"
      mb="$spacing8"
      mx="$spacing8">
      <Text color="$neutral2" variant="subheading2">
        {isEditing ? editingTitle : title}
      </Text>
      {!isEditing ? (
        <TouchableArea
          hapticFeedback
          hitSlop={16}
          testID="favorite-header-row/favorite-button"
          onPress={onPress}>
          <TripleDots
            color="$neutral2"
            size={iconSizes.icon20}
            strokeLinecap="round"
            strokeWidth={1}
          />
        </TouchableArea>
      ) : (
        <TouchableArea hitSlop={16} onPress={onPress}>
          <Text color="$accent1" testID="favorite-header-row/done-button" variant="buttonLabel3">
            {t('common.button.done')}
          </Text>
        </TouchableArea>
      )}
    </Flex>
  )
}
