import { configureStore } from '@reduxjs/toolkit'
import type { Decorator } from '@storybook/react'
import { type PropsWithChildren, useState } from 'react'
import { Provider } from 'react-redux'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { uniswapReducer } from 'uniswap/src/state/uniswapReducer'

/** For stories of components that read the shared redux state or the URL, e.g. the user's fiat currency. */
export const withUniswapStore: Decorator = (Story) => (
  <UniswapStoreProvider>
    <Story />
  </UniswapStoreProvider>
)

function UniswapStoreProvider({ children }: PropsWithChildren): JSX.Element {
  // One store per story, with the reducer defaults; created once, not on every render.
  const [store] = useState(createStoryStore)
  return (
    <Provider store={store}>
      <BlankUrlProvider>{children}</BlankUrlProvider>
    </Provider>
  )
}

function createStoryStore(): ReturnType<typeof configureStore> {
  return configureStore({ reducer: uniswapReducer })
}
