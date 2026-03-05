import { Flex } from 'ui/src'
import { MultichainOptionRow } from 'uniswap/src/components/MultichainTokenDetails/MultichainOptionRow'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

describe(MultichainOptionRow, () => {
  const defaultProps = {
    chainId: UniverseChainId.Mainnet,
    rightContent: <Flex testID="right-content" />,
  }

  it('renders chain name', () => {
    const { queryByText } = render(<MultichainOptionRow {...defaultProps} />)

    expect(queryByText('Ethereum')).toBeTruthy()
  })

  it('renders right content slot', () => {
    const { queryByTestId } = render(<MultichainOptionRow {...defaultProps} />)

    expect(queryByTestId('right-content')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = vi.fn()
    const { getByTestId } = render(<MultichainOptionRow {...defaultProps} testID="row" onPress={onPress} />)

    expect(onPress).toHaveBeenCalledTimes(0)

    fireEvent.press(getByTestId('row'), ON_PRESS_EVENT_PAYLOAD)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders without TouchableArea when no onPress or href', () => {
    const tree = render(<MultichainOptionRow {...defaultProps} />)

    expect(tree).toMatchSnapshot()
  })
})
