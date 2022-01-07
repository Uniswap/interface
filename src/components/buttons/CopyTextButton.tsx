import React, { ComponentProps } from 'react'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { setClipboard } from 'src/utils/clipboard'

interface TextButtonProps extends ComponentProps<typeof TextButton> {
  copyText?: string
}

interface PrimaryButtonProps extends ComponentProps<typeof PrimaryButton> {
  copyText?: string
  label: string
}

export function CopyTextButton({
  copyText,
  children,
  ...rest
}: TextButtonProps | PrimaryButtonProps) {
  const onPress = () => {
    // TODO show a toast box to notify user
    if (copyText) setClipboard(copyText)
    else if (typeof children === 'string') setClipboard(children)
  }

  return <TextButton onPress={onPress} children={children} {...rest} />
}

export function PrimaryCopyTextButton({ copyText, children, ...rest }: PrimaryButtonProps) {
  const onPress = () => {
    // TODO show a toast box to notify user
    if (copyText) setClipboard(copyText)
    else if (typeof children === 'string') setClipboard(children)
  }

  return <PrimaryButton onPress={onPress} children={children} {...rest} />
}
