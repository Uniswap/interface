import { Text, TextProps as TextPropsWithCss } from 'rebass'

import styled, { Color, Theme } from '.'

type TextProps = Omit<TextPropsWithCss, 'css' | 'color'> & { userSelect?: 'none'; color?: Color }

const TextWrapper = styled(Text)<{ userSelect?: 'none'; color?: Color; theme: Theme }>`
  color: ${({ color = 'primary' as Color, theme }) => theme[color]};
  user-select: ${({ userSelect }) => userSelect};
`

const TYPE = {
  h1(props: TextProps) {
    return <TextWrapper fontSize={36} fontWeight={400} lineHeight={1} {...props} />
  },
  h2(props: TextProps) {
    return <TextWrapper fontSize={24} fontWeight={400} lineHeight="32px" {...props} />
  },
  h3(props: TextProps) {
    return <TextWrapper fontSize={20} fontWeight={400} lineHeight={1} {...props} />
  },
  subhead1(props: TextProps) {
    return <TextWrapper fontSize={16} fontWeight={500} lineHeight={1} {...props} />
  },
  subhead2(props: TextProps) {
    return <TextWrapper fontSize={14} fontWeight={500} lineHeight={1} {...props} />
  },
  body1(props: TextProps) {
    return <TextWrapper fontSize={16} fontWeight={400} lineHeight="24px" {...props} />
  },
  body2(props: TextProps) {
    return <TextWrapper fontSize={14} fontWeight={400} lineHeight="20px" {...props} />
  },
  caption(props: TextProps) {
    return <TextWrapper fontSize={12} fontWeight={400} lineHeight="16px" {...props} />
  },
  buttonLarge(props: TextProps) {
    return <TextWrapper fontSize={20} fontWeight={500} lineHeight={1} {...props} />
  },
  buttonMedium(props: TextProps) {
    return <TextWrapper fontSize={16} fontWeight={500} lineHeight={1} {...props} />
  },
  code(props: TextProps) {
    return <TextWrapper fontSize={12} fontWeight={400} lineHeight="16px" fontFamily="Input Mono" {...props} />
  },
}

export default TYPE
