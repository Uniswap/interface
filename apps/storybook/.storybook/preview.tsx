import '@fontsource/inter/400.css'
import '@fontsource/inter/700.css'
import '@tamagui/core/reset.css'
import 'raf/polyfill' // const OriginalNextImage = NextImage.default

import { RouterContext } from 'next/dist/shared/lib/router-context'
import { Provider } from 'app/src/provider/tamagui-provider'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    values: [],
  },
  nextRouter: {
    Provider: RouterContext.Provider,
  },
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    title: 'Theme',
    description: 'Theme for your components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      dynamicTitle: true,
      items: [
        { value: 'light', left: '☀️', title: 'Light Mode' },
        { value: 'dark', left: '🌙', title: 'Dark Mode' },
      ],
    },
  },
}

export const decorators = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Story: any, args: any): JSX.Element => {
    const { theme: themeKey } = args.globals
    let theme = themeKey
    if (
      !theme &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // dark mode
      theme = 'dark'
    }
    return (
      <Provider defaultTheme={theme}>
        <Story />
      </Provider>
    )
  },
]
