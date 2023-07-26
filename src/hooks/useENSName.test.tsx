import { useWeb3React } from '@web3-react/core'
import AuthenticatedHeader from 'components/AccountDrawer/AuthenticatedHeader'
import { mocked } from 'test-utils/mocked'
import { render, waitFor } from 'test-utils/render'

jest.mock('connection', () => ({
  getConnection: () => ({
    type: 'INJECTED',
    getName: () => 'MetaMask',
  }),
}))

describe('useENSName', () => {
  beforeEach(() => {
    mocked(useWeb3React).mockReturnValue({
      chainId: 137,
      account: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    } as ReturnType<typeof useWeb3React>)
  })
  it('should fetch name on polygon', async () => {
    const { chainId } = useWeb3React()
    expect(chainId).toBe(137)
    const container = render(
      <AuthenticatedHeader account="0x50EC05ADe8280758E2077fcBC08D878D4aef79C3" openSettings={() => undefined} />
    )
    await waitFor(() => container.getByTestId('ens-name'), { timeout: 20000 })
    const header = (await waitFor(() => container.getByTestId('account-names'))).innerHTML
    expect(header).toContain('0x50EC...79C3')
  }, 30000)
})
