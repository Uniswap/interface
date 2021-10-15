import { Text, TextProps as TextPropsWithCss } from 'rebass'

import styled, { Color, Theme } from '.'

type TextProps = Omit<TextPropsWithCss, 'css'>

const TextWrapper = styled(Text)<{ color?: Color; theme: Theme }>`
  color: ${({ color = 'primary' as Color, theme }) => theme[color]};
`

export const TYPE = {
  h1(props: TextProps) {
    return <TextWrapper fontSize={36} fontWeight={400} {...props} />
  },
  caption(props: TextProps) {
    return <TextWrapper fontSize={12} fontWeight={400} lineHeight={16} color="secondary" {...props} />
  },
}
