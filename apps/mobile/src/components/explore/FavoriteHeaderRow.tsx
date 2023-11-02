import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementName } from 'src/features/telemetry/constants'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import TripleDots from 'ui/src/assets/icons/triple-dots.svg'
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
  const colors = useSporeColors()
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
        <TouchableArea hapticFeedback hitSlop={16} testID={ElementName.Edit} onPress={onPress}>
          <TripleDots
            color={colors.neutral2.get()}
            height={iconSizes.icon20}
            strokeLinecap="round"
            strokeWidth="1"
            width={iconSizes.icon20}
          />
        </TouchableArea>
      ) : (
        <TouchableArea hitSlop={16} onPress={onPress}>
          <Text color="$accent1" variant="buttonLabel3">
            {t('Done')}
          </Text>
        </TouchableArea>
      )}
    </Flex>
  )
}
