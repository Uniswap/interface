import { ThemeProvider } from '@shopify/restyle'
import { theme } from '../src/styles/theme'

export const parameters = {
  docs: {
    source: {
      // cleans up displayed source code by removing boilerplate decorators
      excludeDecorators: true,
    },
  },
}

export const decorators = [
  (Story) => (
    <ThemeProvider theme={theme}>
      <Story />
    </ThemeProvider>
  ),
]
