import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import TripleDots from 'ui/src/assets/icons/triple-dots.svg'

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
  const theme = useAppTheme()
  return (
    <Flex row alignItems="center" justifyContent="space-between" mb="spacing8" mx="spacing8">
      <Text color="DEP_textSecondary" variant="subheadSmall">
        {isEditing ? editingTitle : title}
      </Text>
      {!isEditing ? (
        <TouchableArea hapticFeedback testID={ElementName.Edit} onPress={onPress}>
          <TripleDots
            color={theme.colors.DEP_textSecondary}
            height={theme.iconSizes.icon20}
            strokeLinecap="round"
            strokeWidth="1"
            width={theme.iconSizes.icon20}
          />
        </TouchableArea>
      ) : (
        <TouchableArea height={theme.iconSizes.icon20} onPress={onPress}>
          <Text color="DEP_accentBranded" variant="buttonLabelSmall">
            {t('Done')}
          </Text>
        </TouchableArea>
      )}
    </Flex>
  )
}
