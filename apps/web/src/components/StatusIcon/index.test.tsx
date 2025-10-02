import StatusIcon from 'components/StatusIcon'
import { useActiveAddresses, useActiveWallet } from 'features/accounts/store/hooks'
import { ExternalWallet } from 'features/accounts/store/types'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

const ACCOUNT = '0x0'

vi.mock('uniswap/src/features/unitags/hooks', () => ({
  useUnitagByAddress: () => ({ unitag: undefined, loading: false }),
}))

vi.mock('../../hooks/useSocksBalance', () => ({
  useHasSocks: () => true,
}))

vi.mock('features/accounts/store/hooks')

vi.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: () => false,
  getFeatureFlag: () => false,
}))

describe('StatusIcon', () => {
  describe('with no account', () => {
    it('renders children in correct order', () => {
      mocked(useActiveWallet).mockReturnValue(undefined)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: undefined,
        svmAddress: undefined,
      })
      const component = render(<StatusIcon />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
      expect(component.queryByTestId('MiniIcon')).not.toBeInTheDocument()
    })
  })

  describe('with account', () => {
    beforeEach(() => {
      mocked(useActiveWallet).mockReturnValue({
        id: 'io.metamask',
        name: 'MetaMask',
        icon: '/src/assets/wallets/metamask-icon.svg',
      } as ExternalWallet)

      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT,
        svmAddress: undefined,
      })
    })

    it('renders children in correct order', () => {
      vi.spyOn(console, 'error').mockImplementation(() => null)

      const component = render(<StatusIcon />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
      expect(component.getByTestId('MiniIcon')).toBeInTheDocument()
    })
  })

  it('renders without mini icons', async () => {
    const component = render(<StatusIcon showMiniIcons={false} />)
    expect(component.queryByTestId('MiniIcon')).not.toBeInTheDocument()
  })
})
