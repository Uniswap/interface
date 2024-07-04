import { Text } from 'ui/src'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { render } from 'uniswap/src/test/test-utils'

it('renders a Pill without image', () => {
  const tree = render(<Pill backgroundColor="$surface2" foregroundColor="#000" label="My Pill Label" />)
  expect(tree).toMatchSnapshot()
})

it('renders a Pill with border', () => {
  const tree = render(<Pill borderColor="$statusSuccess" icon={<Text>Icon</Text>} label="My Second Pill Label" />)
  expect(tree).toMatchSnapshot()
})
