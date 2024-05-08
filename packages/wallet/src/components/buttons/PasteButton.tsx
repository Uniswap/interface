import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { getClipboard } from 'wallet/src/utils/clipboard'

export default function PasteButton({
  inline,
  onPress,
  beforePress,
  afterClipboardReceived,
}: {
  inline?: boolean
  onPress: (text: string) => void
  beforePress?: () => void
  afterClipboardReceived?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const label = t('common.button.paste')

  const onPressButton = async (): Promise<void> => {
    const clipboard = await getClipboard()
    // Since paste may trigger OS permission modal, the following callback is used to control other behavior such as blocking views that need to be shown/hidden.
    afterClipboardReceived?.()
    if (clipboard) {
      onPress(clipboard)
    }
  }

  if (inline) {
    return (
      <TouchableArea p="$spacing8" onPress={onPressButton} onPressIn={beforePress}>
        <Flex centered row gap="$spacing4">
          <Icons.ClipboardPaste color="$neutral2" size="$icon.16" />
          <Text color="$neutral2" variant="buttonLabel4">
            {label}
          </Text>
        </Flex>
      </TouchableArea>
    )
  }

  return (
    <TouchableArea
      backgroundColor="$accent2"
      borderRadius="$rounded12"
      p="$spacing8"
      onPress={onPressButton}
      onPressIn={beforePress}>
      <Flex centered row gap="$spacing4">
        <Text color="$accent1" variant="buttonLabel4">
          {label}
        </Text>
        <Icons.StickyNoteSquare color="$accent1" size="$icon.16" />
      </Flex>
    </TouchableArea>
  )
}
