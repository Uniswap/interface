import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, useSporeColors } from 'ui/src'
import CheckCircle from 'ui/src/assets/icons/check-circle.svg'
import CopySheets from 'ui/src/assets/icons/copy-sheets.svg'
import { iconSizes } from 'ui/src/theme'
import { useTimeout } from 'utilities/src/time/timing'
import { setClipboard } from 'wallet/src/utils/clipboard'

interface Props {
  copyText?: string
}

export function CopyTextButton({ copyText }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const ICON_SIZE = iconSizes.icon20
  const RESET_COPY_STATE_DELAY = 1500

  const [isCopied, setIsCopied] = useState(false)

  const copyIcon = <CopySheets color={colors.neutral1.get()} height={ICON_SIZE} width={ICON_SIZE} />
  const copiedIcon = (
    <CheckCircle color={colors.statusSuccess.val} height={ICON_SIZE} width={ICON_SIZE} />
  )

  const onPress = async (): Promise<void> => {
    if (copyText) {
      await setClipboard(copyText)
    }
    setIsCopied(true)
  }

  const resetIsCopied = useCallback(() => {
    if (isCopied) {
      setIsCopied(false)
    }
  }, [isCopied])

  useTimeout(resetIsCopied, RESET_COPY_STATE_DELAY)

  return (
    <Button icon={isCopied ? copiedIcon : copyIcon} theme="tertiary" onPress={onPress}>
      {isCopied ? t('common.button.copied') : t('common.button.copy')}
    </Button>
  )
}
