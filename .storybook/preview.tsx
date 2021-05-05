import 'inter-ui'
import { Story } from '@storybook/react/types-6-0'
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import React from 'react'
import { Provider as StoreProvider } from 'react-redux'
import { ThemeProvider as SCThemeProvider } from 'styled-components'
import { NetworkContextName } from '../src/constants'
import store from '../src/state'
import { FixedGlobalStyle, theme, ThemedGlobalStyle } from '../src/theme'
import getLibrary from '../src/utils/getLibrary'
import * as storybookThemes from './theme'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  dependencies: {
    withStoriesOnly: true,
    hideEmpty: true,
  },
  docs: {
    theme: storybookThemes.light,
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'iPhone X',
        styles: {
          width: '375px',
          height: '812px',
        },
      },
      tablet: {
        name: 'iPad',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      laptop: {
        name: 'Laptop',
        styles: {
          width: '1024px',
          height: '768px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1440px',
          height: '1024px',
        },
      },
    },
  },
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: ['light', 'dark'],
    },
  },
}

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

const withProviders = (Component: Story, context: Record<string, any>) => {
  const THEME = theme(context.globals.theme === 'dark')
  return (
    <>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ProviderNetwork getLibrary={getLibrary}>
          <StoreProvider store={store}>
            <SCThemeProvider theme={THEME}>
              <FixedGlobalStyle />
              <ThemedGlobalStyle />
              <main>
                <Component />
              </main>
            </SCThemeProvider>
          </StoreProvider>
        </Web3ProviderNetwork>
      </Web3ReactProvider>
    </>
  )
}

export const decorators = [withProviders]
