import React, { ComponentProps } from 'react'
import { TextButton } from 'src/components/buttons/TextButton'
import { openUri } from 'src/utils/linking'

interface LinkButtonProps extends Omit<ComponentProps<typeof TextButton>, 'onPress'> {
  url: string
}

export function LinkButton({ url, children, ...rest }: LinkButtonProps) {
  return (
    <TextButton onPress={() => openUri(url)} {...rest}>
      {children}
    </TextButton>
  )
}
