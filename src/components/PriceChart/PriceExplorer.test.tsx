import React from 'react'
import 'react-native'
import 'react-native-gesture-handler'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'
import { buildGraph } from 'src/components/PriceChart/utils'
import { render } from 'src/test/test-utils'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const graphDatapoints = buildGraph(
  [
    {
      timestamp: 0,
      close: 1551331.3403,
    },
    {
      timestamp: 1,
      close: 3102662.6806,
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
  const tree = render(<PriceExplorer graphs={graphs} />)
  expect(tree).toMatchSnapshot()
})
