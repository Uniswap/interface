import { MockedProvider } from '@apollo/client/testing'
import { ThemeProvider } from '@shopify/restyle'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { useDarkMode } from 'storybook-dark-mode'
import { i18n } from '../src/app/i18n'
import { darkTheme, theme } from '../src/styles/theme'
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
        value: theme.colors.background0,
      },
      {
        name: 'dark',
        value: darkTheme.colors.background0,
      },
    ],
  },
  darkMode: {
    current: 'dark',
    // Override the default dark theme
    dark: {
      ...theme.dark,
      barSelectedColor: darkTheme.colors.accentAction,
      appBg: darkTheme.colors.background0,
      appContentBg: darkTheme.colors.backgroundOutline,
      barBg: darkTheme.colors.background1,
      textColor: darkTheme.colors.textPrimary,
      colorPrimary: darkTheme.colors.accentAction,
      colorSecondary: darkTheme.colors.accentAction,
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
      barSelectedColor: theme.colors.accentAction,
      appBg: theme.colors.background0,
      appContentBg: theme.colors.background1,
      barBg: theme.colors.background1,
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
