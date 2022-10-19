import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import PasteIcon from 'src/assets/icons/paste.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { getClipboard } from 'src/utils/clipboard'

export default function PasteButton({ onPress }: { onPress: (text: string) => void }) {
  const onPressButton = async () => {
    const clipboard = await getClipboard()
    if (clipboard) {
      onPress(clipboard)
    }
  }
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Button
      backgroundColor="accentActiveSoft"
      borderRadius="md"
      px="sm"
      py="xs"
      onPress={onPressButton}>
      <Flex centered row gap="xxs">
        <PasteIcon color={theme.colors.accentActive} />
        <Text color="accentActive" variant="buttonLabelMedium">
          {t('Paste')}
        </Text>
      </Flex>
    </Button>
  )
}
