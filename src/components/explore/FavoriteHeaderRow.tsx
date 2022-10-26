import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { TextButton } from 'src/components/buttons/TextButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'

export function FavoriteHeaderRow({
  isEditing,
  onPress,
}: {
  isEditing: boolean
  onPress: () => void
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="textSecondary" variant="subheadSmall">
        {isEditing ? t('Edit favorites') : t('Favorites')}
      </Text>
      {!isEditing ? (
        <TouchableArea name={ElementName.Edit} onPress={onPress}>
          <TripleDots
            color={theme.colors.textSecondary}
            height={12}
            strokeLinecap="round"
            strokeWidth="1"
            width={14}
          />
        </TouchableArea>
      ) : (
        <TextButton textColor="accentActive" textVariant="buttonLabelSmall" onPress={onPress}>
          {t('Done')}
        </TextButton>
      )}
    </Flex>
  )
}
