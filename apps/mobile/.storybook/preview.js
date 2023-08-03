import { MockedProvider } from '@apollo/client/testing'
import { ThemeProvider } from '@shopify/restyle'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { useDarkMode } from 'storybook-dark-mode'
import { i18n } from '../src/app/i18n'
import { darkTheme, theme } from '../../../packages/ui/src/theme/restyle/theme'
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
        value: theme.colors.DEP_background0,
      },
      {
        name: 'dark',
        value: darkTheme.colors.DEP_background0,
      },
    ],
  },
  darkMode: {
    current: 'dark',
    // Override the default dark theme
    dark: {
      ...theme.dark,
      barSelectedColor: darkTheme.colors.DEP_accentAction,
      appBg: darkTheme.colors.DEP_background0,
      appContentBg: darkTheme.colors.DEP_backgroundOutline,
      barBg: darkTheme.colors.DEP_background1,
      textColor: darkTheme.colors.DEP_textPrimary,
      colorPrimary: darkTheme.colors.DEP_accentAction,
      colorSecondary: darkTheme.colors.DEP_accentAction,
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
      barSelectedColor: theme.colors.DEP_accentAction,
      appBg: theme.colors.DEP_background0,
      appContentBg: theme.colors.DEP_background1,
      barBg: theme.colors.DEP_background1,
      textColor: theme.colors.DEP_textPrimary,
      colorPrimary: theme.colors.DEP_accentAction,
      colorSecondary: theme.colors.DEP_accentAction,
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
