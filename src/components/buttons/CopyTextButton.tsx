import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { setClipboard } from 'src/utils/clipboard'

interface Props {
  copyText?: string
}

const ICON_SIZE = 18

export function CopyTextButton({ copyText }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const [isCopied, setIsCopied] = useState(false)

  const copyIcon = (
    <CopySheets color={theme.colors.textPrimary} height={ICON_SIZE} width={ICON_SIZE} />
  )
  const copiedIcon = (
    <CheckCircle color={theme.colors.accentSuccess} height={ICON_SIZE} width={ICON_SIZE} />
  )

  const onPress = () => {
    if (copyText) setClipboard(copyText)
    setIsCopied(true)
  }

  return (
    <Button
      CustomIcon={isCopied ? copiedIcon : copyIcon}
      emphasis={ButtonEmphasis.Tertiary}
      label={isCopied ? t`Copied` : t`Copy`}
      onPress={onPress}
    />
  )
}
