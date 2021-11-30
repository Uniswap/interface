import { Text, TextProps as TextPropsWithCss } from 'rebass'

import styled, { Color, Theme } from '.'

type TextProps = Omit<TextPropsWithCss, 'css' | 'color'> & { userSelect?: 'none'; color?: Color }

const TextWrapper = styled(Text)<{ userSelect?: 'none'; color?: Color; theme: Theme }>`
  color: ${({ color = 'primary' as Color, theme }) => theme[color]};
  user-select: ${({ userSelect }) => userSelect};
`

export function H1(props: TextProps) {
  return <TextWrapper fontSize={36} fontWeight={400} lineHeight={1} {...props} />
}

export function H2(props: TextProps) {
  return <TextWrapper fontSize={24} fontWeight={400} lineHeight="32px" {...props} />
}

export function H3(props: TextProps) {
  return <TextWrapper fontSize={20} fontWeight={400} lineHeight={1} {...props} />
}

export function Subhead1(props: TextProps) {
  return <TextWrapper fontSize={16} fontWeight={500} lineHeight={1} {...props} />
}

export function Subhead2(props: TextProps) {
  return <TextWrapper fontSize={14} fontWeight={500} lineHeight={1} {...props} />
}

export function Body1(props: TextProps) {
  return <TextWrapper fontSize={16} fontWeight={400} lineHeight="24px" {...props} />
}

export function Body2(props: TextProps) {
  return <TextWrapper fontSize={14} fontWeight={400} lineHeight="20px" {...props} />
}

export function Caption(props: TextProps) {
  return <TextWrapper fontSize={12} fontWeight={400} lineHeight="16px" {...props} />
}

export function ButtonLarge(props: TextProps) {
  return <TextWrapper fontSize={20} fontWeight={500} lineHeight={1} {...props} />
}

export function ButtonMedium(props: TextProps) {
  return <TextWrapper fontSize={16} fontWeight={500} lineHeight={1} {...props} />
}

export function Code(props: TextProps) {
  return <TextWrapper fontSize={12} fontWeight={400} lineHeight="16px" fontFamily="Input Mono" {...props} />
}
