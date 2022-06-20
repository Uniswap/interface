import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import 'react-native'
import 'react-native-gesture-handler'
import { buildGraph } from 'src/components/PriceChart/Model'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'
import { renderWithTheme, WithTheme } from 'src/test/render'

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
  const tree = renderWithTheme(<PriceExplorer graphs={graphs} />)
  expect(tree).toMatchSnapshot()
})

it('navigates between ranges', () => {
  const { getByText } = render(<WithTheme component={<PriceExplorer graphs={graphs} />} />)

  fireEvent.press(getByText(graphs[1].label))
})
