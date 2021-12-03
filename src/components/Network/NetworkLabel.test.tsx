import { ThemeProvider } from '@shopify/restyle'
import { render as RNRender } from '@testing-library/react-native'
import React, { ReactElement } from 'react'
import { NetworkLabel } from 'src/components/Network/NetworkLabel'
import { ChainId } from 'src/constants/chains'
import { theme } from 'src/styles/theme'

const WithTheme = ({ component }: { component: ReactElement }) => {
  return <ThemeProvider theme={theme}>{component}</ThemeProvider>
}

const render = (element: ReactElement) => RNRender(<WithTheme component={element} />).toJSON()

it('renders a NetworkLabel without image', () => {
  const tree = render(<NetworkLabel chainId={ChainId.RINKEBY} />)
  expect(tree).toMatchSnapshot()
})

it('renders a NetworkLabel with border', () => {
  const tree = render(<NetworkLabel chainId={ChainId.RINKEBY} showBorder={true} />)
  expect(tree).toMatchSnapshot()
})
