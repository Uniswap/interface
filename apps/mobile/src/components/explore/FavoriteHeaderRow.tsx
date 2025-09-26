import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function FavoriteHeaderRow({
  title,
  editingTitle,
  isEditing,
  onPress,
  disabled,
}: {
  title: string
  editingTitle: string
  isEditing: boolean
  disabled?: boolean
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
      mx="$spacing8"
      testID={TestID.FavoriteTokensHeader}
    >
      <Text color="$neutral2" variant="subheading2">
        {isEditing ? editingTitle : title}
      </Text>
      {!isEditing ? (
        <TouchableArea hitSlop={16} testID={TestID.Edit} disabled={disabled} onPress={onPress}>
          <Ellipsis color="$neutral2" size="$icon.20" strokeLinecap="round" strokeWidth={1} />
        </TouchableArea>
      ) : (
        <TouchableArea hitSlop={16} onPress={onPress}>
          <Text color="$accent1" testID={TestID.Done} variant="buttonLabel2">
            {t('common.button.done')}
          </Text>
        </TouchableArea>
      )}
    </Flex>
  )
}
