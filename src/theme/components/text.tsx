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
  HeadlineLarge(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={36} lineHeight="44px" color="textPrimary" {...props} />
  },
  LargeHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={36} color="textPrimary" {...props} />
  },
  Link(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={14} color="accentAction" {...props} />
  },
  MediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={20} color="textPrimary" {...props} />
  },
  SubHeader(props: TextProps) {
    // @todo designs use `fontWeight: 500` and we currently have a mix of 600 and 500
    return <TextWrapper fontWeight={600} fontSize={16} color="textPrimary" {...props} />
  },
  SubHeaderSmall(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={14} color="textSecondary" {...props} />
  },
  DeprecatedMain(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_text2" {...props} />
  },
  DeprecatedLink(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_primary1" {...props} />
  },
  DeprecatedLabel(props: TextProps) {
    return <TextWrapper fontWeight={600} color="deprecated_text1" {...props} />
  },
  DeprecatedBlack(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_text1" {...props} />
  },
  DeprecatedWhite(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_white" {...props} />
  },
  DeprecatedBody(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color="deprecated_text1" {...props} />
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
    return <TextWrapper fontWeight={500} color="deprecated_blue1" {...props} />
  },
  DeprecatedYellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_yellow3" {...props} />
  },
  DeprecatedDarkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_text3" {...props} />
  },
  DeprecatedGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color="deprecated_bg3" {...props} />
  },
  DeprecatedItalic(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle="italic" color="deprecated_text2" {...props} />
  },
  DeprecatedError({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={500} color={error ? 'deprecated_red1' : 'deprecated_text2'} {...props} />
  },
}
