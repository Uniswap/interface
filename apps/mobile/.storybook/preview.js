import { MockedProvider } from '@apollo/client/testing'
import { ThemeProvider } from '@shopify/restyle'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { useDarkMode } from 'storybook-dark-mode'
import i18n from 'wallet/src/i18n/i18n'
import { darkTheme, theme } from '../../../packages/ui/src/theme/restyle'
import { ReduxDecorator } from './ReduxDecorator'
import { NavigationDecorator } from './StoryNavigator'

export const parameters = {
  apolloClient: {
    MockedProvider,
  },
  // Notifies Chromatic to pause the animations when they finish at a global level
  chromatic: { pauseAnimationAtEnd: true },
  backgrounds: {
    default: 'dark',
    values: [
      {
        name: 'light',
        value: theme.colors.surface1,
      },
      {
        name: 'dark',
        value: darkTheme.colors.surface1,
      },
    ],
  },
  darkMode: {
    current: 'dark',
    // Override the default dark theme
    dark: {
      ...theme.dark,
      barSelectedColor: darkTheme.colors.accent1,
      appBg: darkTheme.colors.surface1,
      appContentBg: darkTheme.colors.surface3,
      barBg: darkTheme.colors.surface2,
      textColor: darkTheme.colors.neutral1,
      colorPrimary: darkTheme.colors.accent1,
      colorSecondary: darkTheme.colors.accent1,
    },
    docs: {
      inlineStories: false,
      iframeHeight: 300,
      source: {
        // cleans up displayed source code by removing boilerplate decorators
        excludeDecorators: true,
      },
    },
    // Override the default light theme
    light: {
      ...theme.light,
      barSelectedColor: theme.colors.accent1,
      appBg: theme.colors.surface1,
      appContentBg: theme.colors.surface2,
      barBg: theme.colors.surface2,
      textColor: theme.colors.neutral1,
      colorPrimary: theme.colors.accent1,
      colorSecondary: theme.colors.accent1,
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
}

export const decorators = [
  NavigationDecorator,
  ReduxDecorator,
  (Story) => (
    <ThemeProvider theme={useDarkMode() ? darkTheme : theme}>
      <Story />
    </ThemeProvider>
  ),
  (Story) => (
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  ),
]
