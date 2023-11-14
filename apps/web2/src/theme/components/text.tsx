/**
 * Preset styles of the Rebass Text component
 */

import { Text, TextProps as TextPropsOriginal } from 'rebass'
import styled from 'styled-components'

const TextWrapper = styled(Text).withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: keyof string }>`
  color: ${({ color, theme }) => (theme as any)[color]};
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
  UtilityBadge(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize="8px" lineHeight="12px" {...props} />
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
  DeprecatedSmall(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={11} {...props} />
  },
  DeprecatedBlue(props: TextProps) {
    return <TextWrapper fontWeight={485} color="accent1" {...props} />
  },
  DeprecatedYellow(props: TextProps) {
    return <TextWrapper fontWeight={485} color="deprecated_yellow3" {...props} />
  },
  DeprecatedDarkGray(props: TextProps) {
    return <TextWrapper fontWeight={485} color="neutral2" {...props} />
  },
  DeprecatedGray(props: TextProps) {
    return <TextWrapper fontWeight={485} color="surface2" {...props} />
  },
  DeprecatedItalic(props: TextProps) {
    return <TextWrapper fontWeight={485} fontSize={12} fontStyle="italic" color="neutral2" {...props} />
  },
  DeprecatedError({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={485} color={error ? 'critical' : 'neutral2'} {...props} />
  },
}
