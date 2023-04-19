import { styled, Text as TamaguiText } from 'tamagui'

export const Text = styled(TamaguiText, {
  name: 'Text',

  // TODO(EXT-61): keep investigating how to get text to wrap
  wordWrap: 'break-word',
  flex: 1,
  flexWrap: 'wrap',

  variants: {
    // TODO: leverage font tokens instead
    // https://tamagui.dev/docs/core/configuration#font-tokens
    // https://tamagui.dev/docs/core/font-language
    variant: {
      headlineLarge: {
        fontFamily: '$heading',
        fontSize: 40,
        lineHeight: 48,
      },
      headlineMedium: {
        fontFamily: '$heading',
        fontSize: 32,
        lineHeight: 38,
      },
      headlineSmall: {
        fontFamily: '$heading',
        fontSize: 24,
        lineHeight: 28,
      },
      subheadLarge: {
        fontFamily: '$heading',
        fontSize: 20,
        lineHeight: 24,
      },
      subheadSmall: {
        fontFamily: '$heading',
        fontSize: 15,
        lineHeight: 20,
      },
      bodyLarge: {
        fontFamily: '$body',
        fontSize: 17,
        lineHeight: 24,
      },
      bodySmall: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
      },
      bodyMicro: {
        fontFamily: '$body',
        fontSize: 12,
        lineHeight: 17,
      },
      buttonLabelLarge: {
        fontFamily: '$body',
        fontSize: 20,
        lineHeight: 24,
      },
      buttonLabelMedium: {
        fontFamily: '$body',
        fontSize: 17,
        lineHeight: 20,
      },
      buttonLabelSmall: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
      },
      buttonLabelMicro: {
        fontFamily: '$body',
        fontSize: 12,
        lineHeight: 17,
      },
      monospace: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
      },
    },
  } as const,
})
