import { Text, TextProps as TextPropsWithCss } from 'rebass'

import styled, { Color, Theme } from '.'

type TextProps = Omit<TextPropsWithCss, 'css' | 'color'> & { color?: Color }

const TextWrapper = styled(Text)<{ color?: Color; theme: Theme }>`
  color: ${({ color = 'primary' as Color, theme }) => theme[color]};
`

const TYPE = {
  subhead1(props: TextProps) {
    return <TextWrapper fontSize={16} fontWeight={500} {...props} />
  },
  subhead2(props: TextProps) {
    return <TextWrapper fontSize={14} fontWeight={500} {...props} />
  },
  body2(props: TextProps) {
    return <TextWrapper fontSize={14} fontWeight={400} {...props} />
  },
  buttonMedium(props: TextProps) {
    return <TextWrapper fontSize={16} fontWeight={500} {...props} />
  },
}

export default TYPE
