import { UnitagName } from 'uniswap/src/features/unitags/UnitagName'
import { renderWithProviders } from 'uniswap/src/test/render'

it('renders UnitagName without a name', () => {
  const tree = renderWithProviders(<UnitagName animateText textProps={{ fontSize: 12 }} />)
  expect(tree).toMatchSnapshot()
})

it('renders UnitagName with a name', () => {
  const tree = renderWithProviders(<UnitagName animateText animateIcon textProps={{ fontSize: 12 }} name="testing" />)
  expect(tree).toMatchSnapshot()
})
