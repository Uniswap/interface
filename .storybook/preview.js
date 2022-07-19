import { ThemeProvider } from '@shopify/restyle'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import { useDarkMode } from 'storybook-dark-mode'
import { darkTheme, theme } from '../src/styles/theme'
import { NavigationDecorator } from './StoryNavigator'

export const parameters = {
  docs: {
    source: {
      // cleans up displayed source code by removing boilerplate decorators
      excludeDecorators: true,
    },
  },
  darkMode: {
    current: 'dark',
    // Override the default dark theme
    dark: {
      ...theme.dark,
      barSelectedColor: darkTheme.colors.accentAction,
      appBg: darkTheme.colors.backgroundBackdrop,
      appContentBg: darkTheme.colors.backgroundOutline,
      barBg: darkTheme.colors.backgroundSurface,
      textColor: darkTheme.colors.textPrimary,
      colorPrimary: darkTheme.colors.accentAction,
      colorSecondary: darkTheme.colors.accentAction,
    },
    // Override the default light theme
    light: {
      ...theme.light,
      barSelectedColor: theme.colors.accentAction,
      appBg: theme.colors.backgroundBackdrop,
      appContentBg: theme.colors.backgroundSurface,
      barBg: theme.colors.backgroundSurface,
      textColor: theme.colors.textPrimary,
      colorPrimary: theme.colors.accentAction,
      colorSecondary: theme.colors.accentAction,
    },
  },
  options: {
    storySort: { order: ['Introduction', '*', 'WIP'] },
  },
  parameters: { actions: { argTypesRegex: '^on.*' } },
  viewport: {
    viewports: INITIAL_VIEWPORTS,
    defaultViewport: 'iphone12',
  },
  docs: {
    inlineStories: false,
    // TODO: eventually make this value dynamically adjust to content height
    iframeHeight: 300,
  },
}

export const decorators = [
  NavigationDecorator,
  (Story) => (
    <ThemeProvider theme={useDarkMode() ? darkTheme : theme}>
      <Story />
    </ThemeProvider>
  ),
]
