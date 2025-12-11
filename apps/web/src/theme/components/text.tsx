/**
 * Preset styles of the Rebass Text component
 */

import { deprecatedStyled } from 'lib/styled-components'
import { Text, TextProps as TextPropsOriginal } from 'rebass'

const TextWrapper = deprecatedStyled(Text).withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: keyof string }>`
  color: ${({ color, theme }) => (theme as any)[color]};
  letter-spacing: -0.01em;
`

const HeadingWrapper = deprecatedStyled.h1.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: keyof string; fontSize: string; margin: string }>`
  color: ${({ color, theme }) => (theme as any)[color]};
  font-family: inherit;
  font-weight: 485;
  font-size: ${({ fontSize }) => fontSize};
  margin: ${({ margin }) => margin};
  letter-spacing: -0.02em;
`

type TextProps = Omit<TextPropsOriginal, 'css'>

// todo: export each component individually
export const ThemedText = {
  // todo: there should be just one `Body` with default color, no need to make all variations
  BodyPrimary(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={16} color="neutral1" {...props} />
  },
  BodySecondary(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={16} color="neutral2" {...props} />
  },
  BodySmall(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={14} color="neutral1" {...props} />
  },
  HeadlineSmall(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={20} lineHeight="28px" color="neutral1" {...props} />
  },
  HeadlineMedium(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={28} color="neutral1" {...props} />
  },
  HeadlineLarge(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={36} lineHeight="44px" color="neutral1" {...props} />
  },
  LargeHeader(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={36} color="neutral1" {...props} />
  },
  Hero(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={48} color="neutral1" {...props} />
  },
  LabelSmall(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={14} color="neutral2" {...props} />
  },
  LabelMicro(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={12} color="neutral2" {...props} />
  },
  Caption(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={12} lineHeight="16px" color="neutral1" {...props} />
  },
  Link(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={14} color="accent1" {...props} />
  },
  MediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={20} color="neutral1" {...props} />
  },
  SubHeaderLarge(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={20} color="neutral1" {...props} />
  },
  SubHeader(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={16} color="neutral1" lineHeight="24px" {...props} />
  },
  SubHeaderSmall(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={14} color="neutral2" {...props} />
  },
  H1Small(props: TextProps) {
    return <HeadingWrapper fontSize="20px" color="neutral1" {...props} />
  },
  H1Medium(props: TextProps) {
    return <HeadingWrapper fontSize="24px" color="neutral1" {...props} />
  },
  H1Large(props: TextProps) {
    return <HeadingWrapper fontSize="36px" color="neutral1" {...props} />
  },
  DeprecatedMain(props: TextProps) {
    return <TextWrapper fontWeight={485} color="neutral2" {...props} />
  },
  DeprecatedLink(props: TextProps) {
    return <TextWrapper fontWeight={485} color="accent1" {...props} />
  },
  DeprecatedLabel(props: TextProps) {
    return <TextWrapper fontWeight={485} color="neutral1" {...props} />
  },
  DeprecatedBlack(props: TextProps) {
    return <TextWrapper fontWeight={485} color="neutral1" {...props} />
  },
  DeprecatedWhite(props: TextProps) {
    return <TextWrapper fontWeight={485} color="white" {...props} />
  },
  DeprecatedBody(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={16} color="neutral1" {...props} />
  },
  DeprecatedLargeHeader(props: TextProps) {
    return <TextWrapper fontWeight={535} fontSize={24} {...props} />
  },
  DeprecatedMediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={535} fontSize={20} {...props} />
  },
  DeprecatedSubHeader(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={14} {...props} />
  },
}
