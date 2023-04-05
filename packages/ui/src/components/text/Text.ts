import { styled, Text as TamaguiText } from 'tamagui'

export const Text = styled(TamaguiText, {
  name: 'Text',

  variants: {
    // TODO: leverage font tokens instead
    // https://tamagui.dev/docs/core/configuration#font-tokens
    // https://tamagui.dev/docs/core/font-language
    variant: {
      headlineLarge: {
        fontFamily: '$heading',
        fontSize: 40,
        lineHeight: 48,
        maxFontSizeMultiplier: 1.2,
      },
      headlineMedium: {
        fontFamily: '$heading',
        fontSize: 32,
        lineHeight: 38,
        maxFontSizeMultiplier: 1.2,
      },
      headlineSmall: {
        fontFamily: '$heading',
        fontSize: 24,
        lineHeight: 28,
        maxFontSizeMultiplier: 1.2,
      },
      subheadLarge: {
        fontFamily: '$heading',
        fontSize: 20,
        lineHeight: 24,
        maxFontSizeMultiplier: 1.4,
      },
      subheadSmall: {
        fontFamily: '$heading',
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.4,
      },
      bodyLarge: {
        fontFamily: '$body',
        fontSize: 17,
        lineHeight: 24,
        maxFontSizeMultiplier: 1.4,
      },
      bodySmall: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.4,
      },
      bodyMicro: {
        fontFamily: '$body',
        fontSize: 12,
        lineHeight: 17,
        maxFontSizeMultiplier: 1.4,
      },
      buttonLabelLarge: {
        fontFamily: '$body',
        fontSize: 20,
        lineHeight: 24,
        maxFontSizeMultiplier: 1.2,
      },
      buttonLabelMedium: {
        fontFamily: '$body',
        fontSize: 17,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.2,
      },
      buttonLabelSmall: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.2,
      },
      buttonLabelMicro: {
        fontFamily: '$body',
        fontSize: 12,
        lineHeight: 17,
        maxFontSizeMultiplier: 1.2,
      },
      monospace: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.2,
      },
    },
  } as const,
})
