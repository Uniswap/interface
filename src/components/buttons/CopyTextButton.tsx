import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { setClipboard } from 'src/utils/clipboard'
import { useTimeout } from 'src/utils/timing'

interface Props {
  copyText?: string
}

export function CopyTextButton({ copyText }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const ICON_SIZE = theme.iconSizes.icon20
  const RESET_COPY_STATE_DELAY = 1500

  const [isCopied, setIsCopied] = useState(false)

  const copyIcon = (
    <CopySheets color={theme.colors.textPrimary} height={ICON_SIZE} width={ICON_SIZE} />
  )
  const copiedIcon = (
    <CheckCircle color={theme.colors.accentSuccess} height={ICON_SIZE} width={ICON_SIZE} />
  )

  const onPress = (): void => {
    if (copyText) setClipboard(copyText)
    setIsCopied(true)
  }

  const resetIsCopied = useCallback(() => {
    if (isCopied) {
      setIsCopied(false)
    }
  }, [isCopied])

  useTimeout(resetIsCopied, RESET_COPY_STATE_DELAY)

  return (
    <Button
      CustomIcon={isCopied ? copiedIcon : copyIcon}
      emphasis={ButtonEmphasis.Tertiary}
      label={isCopied ? t`Copied` : t`Copy`}
      onPress={onPress}
    />
  )
}
