import { styled, Text as TamaguiText } from '@tamagui/core'

export const Text = styled(TamaguiText, {
  name: 'Text',

  variants: {
    // TODO: leverage font tokens instead
    // https://tamagui.dev/docs/core/configuration#font-tokens
    // https://tamagui.dev/docs/core/font-language
    variant: {
      headlineLarge: {
        fontSize: 40,
        lineHeight: 48,
        maxFontSizeMultiplier: 1.2,
      },
      headlineMedium: {
        fontSize: 32,
        lineHeight: 38,
        maxFontSizeMultiplier: 1.2,
      },
      headlineSmall: {
        fontSize: 24,
        lineHeight: 28,
        maxFontSizeMultiplier: 1.2,
      },
      subheadLarge: {
        fontSize: 20,
        lineHeight: 24,
        maxFontSizeMultiplier: 1.4,
      },
      subheadSmall: {
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.4,
      },
      bodyLarge: {
        fontSize: 17,
        lineHeight: 24,
        maxFontSizeMultiplier: 1.4,
      },
      bodySmall: {
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.4,
      },
      bodyMicro: {
        fontSize: 12,
        lineHeight: 17,
        maxFontSizeMultiplier: 1.4,
      },
      buttonLabelLarge: {
        fontSize: 20,
        lineHeight: 24,
        maxFontSizeMultiplier: 1.2,
      },
      buttonLabelMedium: {
        fontSize: 17,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.2,
      },
      buttonLabelSmall: {
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.2,
      },
      buttonLabelMicro: {
        fontSize: 12,
        lineHeight: 17,
        maxFontSizeMultiplier: 1.2,
      },
      monospace: {
        fontSize: 15,
        lineHeight: 20,
        maxFontSizeMultiplier: 1.2,
      },
    },
  },
})
