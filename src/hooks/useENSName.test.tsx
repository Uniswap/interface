import AuthenticatedHeader from 'components/AccountDrawer/AuthenticatedHeader'
import { render, waitFor } from 'test-utils/render'

jest.mock('@web3-react/core', () => ({
  chainId: 137,
}))
jest.mock('connection', () => ({
  getConnection: () => ({
    type: 'INJECTED',
    getName: () => 'MetaMask',
  }),
}))

describe('useENSName', () => {
  it('should fetch name on polygon', async () => {
    const container = render(
      <AuthenticatedHeader account="0x50EC05ADe8280758E2077fcBC08D878D4aef79C3" openSettings={() => undefined} />
    )
    const header = (await waitFor(() => container.getByTestId('account-names'))).innerHTML
    expect(header).toContain('0x50EC...79C3')
  })
})
