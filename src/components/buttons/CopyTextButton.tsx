import React, { ComponentProps } from 'react'
import { TextButton } from 'src/components/buttons/TextButton'
import { setClipboard } from 'src/utils/clipboard'

interface Props extends ComponentProps<typeof TextButton> {
  copyText?: string
}

export function CopyTextButton(props: Props) {
  const onPress = () => {
    // TODO show a toast box to notify user
    if (props.copyText) setClipboard(props.copyText)
    else if (typeof props.children === 'string') setClipboard(props.children)
  }
  return <TextButton onPress={onPress} {...props} />
}
