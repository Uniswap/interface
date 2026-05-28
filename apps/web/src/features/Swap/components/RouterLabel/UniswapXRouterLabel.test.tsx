import { UniswapXRouterLabel } from '~/features/Swap/components/RouterLabel/UniswapXRouterLabel'
import { render, screen } from '~/test-utils/render'

describe('UniswapXRouterLabel', () => {
  it('matches snapshot', () => {
    // crypto.randomUUID is globally mocked to return deterministic test-uuid-N values
    const { asFragment } = render(<UniswapXRouterLabel>test router label</UniswapXRouterLabel>)
    expect(screen.getByText('test router label')).toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })
})
