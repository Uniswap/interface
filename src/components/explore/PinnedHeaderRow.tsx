import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'

export function PinnedHeaderRow({
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
        {isEditing ? t('Edit pins') : t('Pinned')}
      </Text>
      {!isEditing ? (
        <Button name={ElementName.Edit} onPress={onPress}>
          <TripleDots
            color={theme.colors.textSecondary}
            height={12}
            strokeLinecap="round"
            strokeWidth="1"
            width={14}
          />
        </Button>
      ) : (
        <TextButton textColor="accentActive" textVariant="smallLabel" onPress={onPress}>
          {t('Done')}
        </TextButton>
      )}
    </Flex>
  )
}
