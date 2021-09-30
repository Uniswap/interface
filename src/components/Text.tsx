import { createText } from '@shopify/restyle'
import { Theme } from 'src/styles/theme'

// Use this text component throughout the app instead of
// Default RN Text for theme support
export const Text = createText<Theme>()
