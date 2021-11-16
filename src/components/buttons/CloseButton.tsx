import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import XIcon from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { Theme } from 'src/styles/theme'

type Props = {
  onPress: () => void
  size?: number
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function CloseButton(props: Props) {
  const { onPress, size, ...rest } = props
  return (
    <Button onPress={onPress} {...rest}>
      <XIcon width={size ?? 20} height={size ?? 20} />
    </Button>
  )
}
