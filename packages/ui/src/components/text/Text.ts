import { styled, Text as TamaguiText } from 'tamagui'

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
        fontSize: 40,
        lineHeight: 48,
        fontWeight: '600',
      },
      headlineMedium: {
        fontFamily: '$heading',
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '500',
      },
      headlineSmall: {
        fontFamily: '$heading',
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '500',
      },
      subheadLarge: {
        fontFamily: '$heading',
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '500',
      },
      subheadSmall: {
        fontFamily: '$heading',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '500',
      },
      bodyLarge: {
        fontFamily: '$body',
        fontSize: 17,
        lineHeight: 24,
        fontWeight: '500',
      },
      bodySmall: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '400',
      },
      bodyMicro: {
        fontFamily: '$body',
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '400',
      },
      buttonLabelLarge: {
        fontFamily: '$body',
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '600',
      },
      buttonLabelMedium: {
        fontFamily: '$body',
        fontSize: 17,
        lineHeight: 20,
        fontWeight: '600',
      },
      buttonLabelSmall: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '600',
      },
      buttonLabelMicro: {
        fontFamily: '$body',
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '600',
      },
      monospace: {
        fontFamily: '$body',
        fontSize: 15,
        lineHeight: 20,
      },
    },
  } as const,
})
