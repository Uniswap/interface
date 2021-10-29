import { ThemeProvider } from '@shopify/restyle'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import 'react-native'
import 'react-native-gesture-handler'
import { Graph } from 'src/components/PriceChart/Graph'
import { buildGraph, GraphIndex, GraphMetadata } from 'src/components/PriceChart/Model'
import { theme } from 'src/styles/theme'

const graphDatapoints = buildGraph([
  {
    timestamp: 0,
    close: 100,
    open: 200,
  },
  {
    timestamp: 1,
    close: 200,
    open: 300,
  },
])

const graphs: GraphMetadata[] = [0, 1, 2, 3, 4].map((i) => ({
  label: `Graph ${i}`,
  value: i as GraphIndex,
  data: graphDatapoints,
}))

it('renders correctly', () => {
  const tree = render(
    <ThemeProvider theme={theme}>
      <Graph graphs={graphs} />
    </ThemeProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})

it('navigates between ranges', () => {
  const { getByText } = render(
    <ThemeProvider theme={theme}>
      <Graph graphs={graphs} />
    </ThemeProvider>
  )

  fireEvent.press(getByText(graphs[1].label))
})
