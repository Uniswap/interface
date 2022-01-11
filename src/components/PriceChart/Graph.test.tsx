import { ThemeProvider } from '@shopify/restyle'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import 'react-native'
import 'react-native-gesture-handler'
import { Graph } from 'src/components/PriceChart/Graph'
import { buildGraph } from 'src/components/PriceChart/Model'
import { theme } from 'src/styles/theme'

const graphDatapoints = buildGraph(
  [
    {
      timestamp: 0,
      close: 100,
    },
    {
      timestamp: 1,
      close: 200,
    },
  ],
  3
)!

const buildGraphMetadata = (index: number) =>
  ({
    label: `Graph ${index}`,
    index,
    data: graphDatapoints,
  } as const)

const graphs = [
  buildGraphMetadata(0),
  buildGraphMetadata(1),
  buildGraphMetadata(2),
  buildGraphMetadata(3),
  buildGraphMetadata(4),
] as const

it('renders correctly', () => {
  const tree = render(
    <ThemeProvider theme={theme}>
      <Graph graphs={graphs} title="My Token" />
    </ThemeProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})

it('navigates between ranges', () => {
  const { getByText } = render(
    <ThemeProvider theme={theme}>
      <Graph graphs={graphs} title="My token" />
    </ThemeProvider>
  )

  fireEvent.press(getByText(graphs[1].label))
})
