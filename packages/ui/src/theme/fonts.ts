import { createInterFont } from '@tamagui/font-inter'

export const fonts = {
  headlineLarge: {
    fontSize: 40,
    lineHeight: 48,
  },
  headlineMedium: {
    fontSize: 32,
    lineHeight: 38,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 28,
  },
  subheadLarge: {
    fontSize: 20,
    lineHeight: 24,
  },
  subheadSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMicro: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonLabelLarge: {
    fontSize: 20,
    lineHeight: 24,
  },
  buttonLabelMedium: {
    fontSize: 16,
    lineHeight: 20,
  },
  buttonLabelSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonLabelMicro: {
    fontSize: 12,
    lineHeight: 16,
  },
  monospace: {
    fontSize: 14,
    lineHeight: 20,
  },
}

// TODO(EXT-148): leverage font tokens better
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const headingFont: any = createInterFont({})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const bodyFont: any = createInterFont({})
