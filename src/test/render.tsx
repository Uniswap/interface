import { ThemeProvider } from '@shopify/restyle'
import { render as RNRender } from '@testing-library/react-native'
import React, { ReactElement } from 'react'
import { theme } from 'src/styles/theme'

const WithTheme = ({ component }: { component: ReactElement }) => {
  return <ThemeProvider theme={theme}>{component}</ThemeProvider>
}

export const renderWithTheme = (element: ReactElement) =>
  RNRender(<WithTheme component={element} />).toJSON()
