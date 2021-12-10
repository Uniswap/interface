import { Text, TextProps as TextPropsWithCss } from 'rebass'

import styled from './styled'
import { Color } from './theme'

type TextProps = Omit<TextPropsWithCss, 'css' | 'color'> & { color?: Color }

const TextWrapper = styled(Text)<{ color?: Color }>`
  color: ${({ color = 'currentColor', theme }) => theme[color as Color]};
`

export function H1(props: TextProps) {
  return <TextWrapper fontSize={36} fontWeight={400} lineHeight="36px" {...props} />
}

export function H2(props: TextProps) {
  return <TextWrapper fontSize={24} fontWeight={400} lineHeight="32px" {...props} />
}

export function H3(props: TextProps) {
  return <TextWrapper fontSize={20} fontWeight={400} lineHeight="20px" {...props} />
}

export function Subhead1(props: TextProps) {
  return <TextWrapper fontSize={16} fontWeight={500} lineHeight="16px" {...props} />
}

export function Subhead2(props: TextProps) {
  return <TextWrapper fontSize={14} fontWeight={500} lineHeight="14px" {...props} />
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

export function Badge(props: TextProps) {
  return <TextWrapper fontSize={8} fontWeight={600} lineHeight="8px" {...props} />
}

export function ButtonLarge(props: TextProps) {
  return <TextWrapper fontSize={20} fontWeight={500} lineHeight="20px" {...props} />
}

export function ButtonMedium(props: TextProps) {
  return <TextWrapper fontSize={16} fontWeight={500} lineHeight="16px" {...props} />
}

export function ButtonSmall(props: TextProps) {
  return <TextWrapper fontSize={14} fontWeight={500} lineHeight="14px" {...props} />
}

export function Code(props: TextProps) {
  return <TextWrapper fontSize={12} fontWeight={400} lineHeight="16px" fontFamily="Input Mono" {...props} />
}
