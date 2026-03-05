import { v4 as uuid } from 'uuid'
import UniswapXRouterLabel from '~/components/RouterLabel/UniswapXRouterLabel'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('uuid')

describe('UniswapXRouterLabel', () => {
  it('matches snapshot', () => {
    mocked(uuid).mockReturnValue('test-id')
    const { asFragment } = render(<UniswapXRouterLabel>test router label</UniswapXRouterLabel>)
    expect(screen.getByText('test router label')).toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })
})
