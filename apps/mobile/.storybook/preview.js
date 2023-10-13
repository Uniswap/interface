import { MockedProvider } from '@apollo/client/testing'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from 'wallet/src/i18n/i18n'
import {
  darkColors,
  lightColors,
} from '../../../packages/ui/src/theme/color/colors'
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
      barSelectedColor: darkColors.accent1,
      appBg: darkColors.surface1,
      appContentBg: darkColors.surface3,
      barBg: darkColors.surface2,
      textColor: darkColors.neutral1,
      colorPrimary: darkColors.accent1,
      colorSecondary: darkColors.accent1,
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
      barSelectedColor: lightColors.accent1,
      appBg: lightColors.surface1,
      appContentBg: lightColors.surface2,
      barBg: lightColors.surface2,
      textColor: lightColors.neutral1,
      colorPrimary: lightColors.accent1,
      colorSecondary: lightColors.accent1,
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
  (Story) => <Story />,
  (Story) => (
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  ),
]
