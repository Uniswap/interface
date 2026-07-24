import { render, screen } from '@testing-library/react-native'
import { UniwindExample } from './UniwindExample'

// Render smoke test for the uniwind integration reference component. Makes the
// component's intent machine-verifiable (it's exercised, not dead code) and
// guards that the shared-token className usage renders without crashing. The
// className -> style resolution itself happens in uniwind's Metro transformer,
// not in jest, so this only asserts the component mounts and renders content.
describe('UniwindExample', () => {
  it('renders the token-styled content without crashing', () => {
    render(<UniwindExample />)
    expect(screen.getByText('Uniwind is wired up')).toBeTruthy()
  })
})
