import { Text, TextProps as TextPropsWithCss } from 'rebass'

import styled, { useTheme } from './styled'
import { Color } from './theme'

type TextProps = Omit<TextPropsWithCss, 'css' | 'color' | 'userSelect'> & {
  color?: Color
  userSelect?: true
}

const TextWrapper = styled(Text)<{ color?: Color; lineHeight: string; noWrap?: true; userSelect?: true }>`
  color: ${({ color = 'currentColor', theme }) => theme[color as Color]};
  // Avoid the need for placeholders by setting min-height to line-height.
  min-height: ${({ lineHeight }) => lineHeight};
  // user-select is set to 'none' at the root element (Widget), but is desired for displayed data.
  // user-select must be configured through styled-components for cross-browser compat (eg to auto-generate prefixed properties).
  user-select: ${({ userSelect }) => userSelect && 'text'};
  white-space: ${({ noWrap }) => noWrap && 'nowrap'};
`

const TransitionTextWrapper = styled(TextWrapper)`
  transition: font-size 0.25s ease-out, line-height 0.25s ease-out;
`

export function H1(props: TextProps) {
  return (
    <TextWrapper className="headline headline-1" fontSize={36} fontWeight={400} lineHeight="36px" noWrap {...props} />
  )
}

export function H2(props: TextProps) {
  return (
    <TextWrapper className="headline headline-2" fontSize={32} fontWeight={400} lineHeight="32px" noWrap {...props} />
  )
}

export function H3(props: TextProps) {
  return (
    <TextWrapper className="headline headline-3" fontSize={20} fontWeight={400} lineHeight="20px" noWrap {...props} />
  )
}

export function Subhead1(props: TextProps) {
  return (
    <TextWrapper className="subhead subhead-1" fontSize={16} fontWeight={500} lineHeight="16px" noWrap {...props} />
  )
}

export function Subhead2(props: TextProps) {
  return (
    <TextWrapper className="subhead subhead-2" fontSize={14} fontWeight={500} lineHeight="14px" noWrap {...props} />
  )
}

export function Body1(props: TextProps) {
  return <TextWrapper className="body body-1" fontSize={16} fontWeight={400} lineHeight="24px" {...props} />
}

export function Body2(props: TextProps) {
  return <TextWrapper className="body body-2" fontSize={14} fontWeight={400} lineHeight="20px" {...props} />
}

export function Caption(props: TextProps) {
  return <TextWrapper className="caption" fontSize={12} fontWeight={400} lineHeight="16px" {...props} />
}

export function Badge(props: TextProps) {
  return <TextWrapper className="badge" fontSize={8} fontWeight={600} lineHeight="8px" noWrap />
}

export function ButtonLarge(props: TextProps) {
  return (
    <TextWrapper className="button button-large" fontSize={20} fontWeight={500} lineHeight="20px" noWrap {...props} />
  )
}

export function ButtonMedium(props: TextProps) {
  return (
    <TextWrapper className="button button-medium" fontSize={16} fontWeight={500} lineHeight="16px" noWrap {...props} />
  )
}

export function ButtonSmall(props: TextProps) {
  return (
    <TextWrapper className="button button-small" fontSize={14} fontWeight={500} lineHeight="14px" noWrap {...props} />
  )
}

export function TransitionButton(props: TextProps & { buttonSize: 'small' | 'medium' | 'large' }) {
  const className = `button button-${props.buttonSize}`
  const fontSize = { small: 14, medium: 16, large: 20 }[props.buttonSize]
  const lineHeight = `${fontSize}px`
  return (
    <TransitionTextWrapper
      className={className}
      fontSize={fontSize}
      fontWeight={500}
      lineHeight={lineHeight}
      noWrap
      {...props}
    />
  )
}

export function Code(props: TextProps) {
  const { fontFamilyCode } = useTheme()
  return (
    <TextWrapper
      className="code"
      fontSize={12}
      fontWeight={400}
      lineHeight="16px"
      fontFamily={fontFamilyCode}
      {...props}
    />
  )
}
