import React, { PropsWithChildren, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { setClipboard } from 'src/utils/clipboard'

interface PrimaryButtonProps {
  copyText?: string
}

const ICON_SIZE = 18

export function CopyTextButton({ copyText, children }: PropsWithChildren<PrimaryButtonProps>) {
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
    else if (typeof children === 'string') setClipboard(children)
    setIsCopied(true)
  }

  return (
    <PrimaryButton
      children={children}
      icon={isCopied ? copiedIcon : copyIcon}
      label={isCopied ? t`Copied` : t`Copy`}
      textColor="textPrimary"
      variant="transparent"
      onPress={onPress}
    />
  )
}
