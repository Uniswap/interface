import { styled, Text as TamaguiText } from 'tamagui'
import { fonts } from 'ui/theme/fonts'

export const Text = styled(TamaguiText, {
  name: 'Text',

  // TODO(EXT-61): keep investigating how to get text to wrap
  wordWrap: 'break-word',
  flex: 1,
  flexGrow: 0, // Would expect the default to be this, but default seems to be 1
  flexWrap: 'wrap',

  variants: {
    // TODO: leverage font tokens instead
    // https://tamagui.dev/docs/core/configuration#font-tokens
    // https://tamagui.dev/docs/core/font-language
    variant: {
      headlineLarge: {
        fontFamily: '$heading',
        fontSize: fonts.headlineLarge.fontSize,
        lineHeight: fonts.headlineLarge.lineHeight,
        fontWeight: '600',
      },
      headlineMedium: {
        fontFamily: '$heading',
        fontSize: fonts.headlineMedium.fontSize,
        lineHeight: fonts.headlineMedium.lineHeight,
        fontWeight: '500',
      },
      headlineSmall: {
        fontFamily: '$heading',
        fontSize: fonts.headlineSmall.fontSize,
        lineHeight: fonts.headlineSmall.lineHeight,
        fontWeight: '500',
      },
      subheadLarge: {
        fontFamily: '$heading',
        fontSize: fonts.subheadLarge.fontSize,
        lineHeight: fonts.subheadLarge.lineHeight,
        fontWeight: '500',
      },
      subheadSmall: {
        fontFamily: '$heading',
        fontSize: fonts.subheadSmall.fontSize,
        lineHeight: fonts.subheadSmall.lineHeight,
        fontWeight: '500',
      },
      bodyLarge: {
        fontFamily: '$body',
        fontSize: fonts.bodyLarge.fontSize,
        lineHeight: fonts.bodyLarge.lineHeight,
        fontWeight: '500',
      },
      bodySmall: {
        fontFamily: '$body',
        fontSize: fonts.bodySmall.fontSize,
        lineHeight: fonts.bodySmall.lineHeight,
        fontWeight: '400',
      },
      bodyMicro: {
        fontFamily: '$body',
        fontSize: fonts.bodyMicro.fontSize,
        lineHeight: fonts.bodyMicro.lineHeight,
        fontWeight: '400',
      },
      buttonLabelLarge: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelLarge.fontSize,
        lineHeight: fonts.buttonLabelLarge.lineHeight,
        fontWeight: '600',
      },
      buttonLabelMedium: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelMedium.fontSize,
        lineHeight: fonts.buttonLabelMedium.lineHeight,
        fontWeight: '600',
      },
      buttonLabelSmall: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelSmall.fontSize,
        lineHeight: fonts.buttonLabelSmall.lineHeight,
        fontWeight: '600',
      },
      buttonLabelMicro: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelMicro.fontSize,
        lineHeight: fonts.buttonLabelMicro.lineHeight,
        fontWeight: '600',
      },
      monospace: {
        fontFamily: '$body',
        fontSize: fonts.bodySmall.fontSize,
        lineHeight: fonts.bodySmall.lineHeight,
      },
    },
  } as const,
})
