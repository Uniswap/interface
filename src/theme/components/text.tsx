/**
 * Preset styles of the Rebass Text component
 */

import { Text, TextProps as TextPropsOriginal } from 'rebass'
import styled from 'styled-components/macro'

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
    return <TextWrapper fontWeight={400} fontSize={16} color="textPrimary" {...props} />
  },
  BodySecondary(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color="textSecondary" {...props} />
  },
  BodySmall(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} color="textPrimary" {...props} />
  },
  Caption(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={12} color="textPrimary" {...props} />
  },
  HeadlineSmall(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={20} lineHeight="28px" color="textPrimary" {...props} />
  },
  HeadlineMedium(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={28} color="textPrimary" {...props} />
  },
  HeadlineLarge(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={36} lineHeight="44px" color="textPrimary" {...props} />
  },
  LargeHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={36} color="textPrimary" {...props} />
  },
  Hero(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={48} color="textPrimary" {...props} />
  },
  LabelSmall(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={14} color="textSecondary" {...props} />
  },
  Link(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={14} color="accentAction" {...props} />
  },
  MediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={20} color="textPrimary" {...props} />
  },
  SubHeaderLarge(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={20} color="textPrimary" {...props} />
  },
  SubHeader(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={16} color="textPrimary" lineHeight="24px" {...props} />
  },
  SubHeaderSmall(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={14} color="textSecondary" {...props} />
  },
  UtilityBadge(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize="8px" lineHeight="12px" {...props} />
  },
  DeprecatedMain(props: TextProps) {
    return <TextWrapper fontWeight={500} color="textSecondary" {...props} />
  },
  DeprecatedLink(props: TextProps) {
    return <TextWrapper fontWeight={500} color="accentAction" {...props} />
  },
  DeprecatedLabel(props: TextProps) {
    return <TextWrapper fontWeight={600} color="textPrimary" {...props} />
  },
  DeprecatedBlack(props: TextProps) {
    return <TextWrapper fontWeight={500} color="textPrimary" {...props} />
  },
  DeprecatedWhite(props: TextProps) {
    return <TextWrapper fontWeight={500} color="white" {...props} />
  },
  DeprecatedBody(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color="textPrimary" {...props} />
  },
  DeprecatedLargeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  DeprecatedMediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={20} {...props} />
  },
  DeprecatedSubHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  DeprecatedSmall(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  DeprecatedBlue(props: TextProps) {
    return <TextWrapper fontWeight={500} color="accentAction" {...props} />
  },
  DeprecatedYellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_yellow3" {...props} />
  },
  DeprecatedDarkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color="textTertiary" {...props} />
  },
  DeprecatedGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_bg3" {...props} />
  },
  DeprecatedItalic(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle="italic" color="textSecondary" {...props} />
  },
  DeprecatedError({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={500} color={error ? 'accentFailure' : 'textSecondary'} {...props} />
  },
}
