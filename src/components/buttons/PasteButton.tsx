import React from 'react'
import { useTranslation } from 'react-i18next'
import PasteIcon from 'src/assets/icons/paste.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components-uds/Button/Button'
import { getClipboard } from 'src/utils/clipboard'

export default function PasteButton({ onPress }: { onPress: (text: string) => void }) {
  const onPressButton = async () => {
    const clipboard = await getClipboard()
    if (clipboard) {
      onPress(clipboard)
    }
  }
  const { t } = useTranslation()

  return (
    <Button
      IconName={PasteIcon}
      emphasis={ButtonEmphasis.Secondary}
      label={t('Paste')}
      size={ButtonSize.Small}
      onPress={onPressButton}
    />
  )
}
