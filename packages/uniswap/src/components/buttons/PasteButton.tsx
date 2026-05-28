import { useTranslation } from 'react-i18next'
import { Flex, Text, TextProps, TouchableArea } from 'ui/src'
import { ClipboardPaste } from 'ui/src/components/icons/ClipboardPaste'
import { StickyNoteSquare } from 'ui/src/components/icons/StickyNoteSquare'
import { getClipboard } from 'uniswap/src/utils/clipboard'

export default function PasteButton({
  inline,
  onPress,
  beforePress,
  afterClipboardReceived,
  textVariant = 'buttonLabel2',
}: {
  inline?: boolean
  onPress: (text: string) => void
  beforePress?: () => void
  afterClipboardReceived?: () => void
  textVariant?: Extract<TextProps['variant'], 'buttonLabel2' | 'buttonLabel3'>
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
          <ClipboardPaste color="$neutral2" size="$icon.16" />
          <Text color="$neutral2" variant={textVariant}>
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
      onPressIn={beforePress}
    >
      <Flex centered row gap="$spacing4">
        <Text color="$accent1" variant="buttonLabel3">
          {label}
        </Text>
        <StickyNoteSquare color="$accent1" size="$icon.16" />
      </Flex>
    </TouchableArea>
  )
}
