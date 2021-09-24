import { render, RenderOptions } from '@testing-library/react'
import React, { FC, ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import store from 'state'
import ThemeProvider from 'theme'

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
