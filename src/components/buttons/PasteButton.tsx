import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import PasteIcon from 'src/assets/icons/paste.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { getClipboard } from 'src/utils/clipboard'
import { opacify } from 'src/utils/colors'

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
      borderRadius="md"
      px="sm"
      py="xs"
      style={{ backgroundColor: opacify(10, theme.colors.accentBackgroundActive) }}
      onPress={onPressButton}>
      <Flex centered row gap="xs">
        <PasteIcon />
        <Text color="accentBackgroundActive" variant="mediumLabel">
          {t('paste')}
        </Text>
      </Flex>
    </Button>
  )
}
