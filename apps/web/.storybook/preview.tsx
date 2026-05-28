import '../src/global.css'
import '../src/polyfills'
import type { Preview } from '@storybook/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { ReactRouterUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { TamaguiProvider } from '../src/theme/tamaguiProvider'
import store from '~/state'

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ReactRouterUrlProvider>
          <Provider store={store}>
            <TamaguiProvider>
              {/* 👇 Decorators in Storybook also accept a function. Replace <Story/> with Story() to enable it  */}
              <Story />
            </TamaguiProvider>
          </Provider>
        </ReactRouterUrlProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
