import React, { FC, ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import ThemeProvider from 'theme'
import store from 'state'
import { Provider } from 'react-redux'

const WithProviders: FC = ({ children }: { children?: ReactNode }) => {
  return (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: WithProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
