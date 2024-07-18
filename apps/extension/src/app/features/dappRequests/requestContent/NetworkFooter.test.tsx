import { NetworksFooter } from 'src/app/features/dappRequests/requestContent/NetworksFooter'
import { cleanup, render } from 'src/test/test-utils'

describe(NetworksFooter, () => {
  it('renders without error', async () => {
    const tree = render(<NetworksFooter />)

    expect(tree).toMatchSnapshot()
    cleanup()
  })
})
