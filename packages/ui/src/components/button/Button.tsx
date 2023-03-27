import { Stack, styled } from 'tamagui'
import { ComponentProps, PropsWithChildren } from 'react'
import { Text } from '../text/Text'

export const ButtonFrame = styled(Stack, {
  name: 'ButtonFrame',
  tag: 'button',

  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'nowrap',
  flexDirection: 'row',
  cursor: 'pointer',

  // TODO: move to `tamagui` or
  // https://github.com/tamagui/tamagui/blob/master/packages/button/src/Button.tsx
})

export const ButtonText = styled(Text, {
  name: 'ButtonText',
  userSelect: 'none',
  cursor: 'pointer',
  // flexGrow 1 leads to inconsistent native style where text pushes to start of view
  flexGrow: 0,
  flexShrink: 1,
  ellipse: true,

  // TODO: ditto
})

// TODO: use extractable and themable for compile time benefits
// or migrate to tamaui
export function Button({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof ButtonFrame>>): JSX.Element {
  return (
    <ButtonFrame {...props}>
      <ButtonText>{children}</ButtonText>
    </ButtonFrame>
  )
}
