import StatusIcon from 'components/Identicon/StatusIcon'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

const ACCOUNT = '0x0'

vi.mock('uniswap/src/features/unitags/hooks', () => ({
  useUnitagByAddress: () => ({ unitag: undefined, loading: false }),
}))

vi.mock('../../hooks/useSocksBalance', () => ({
  useHasSocks: () => true,
}))

vi.mock('uniswap/src/features/wallet/hooks/useWallet')

describe('StatusIcon', () => {
  describe('with no account', () => {
    it('renders children in correct order', () => {
      mocked(useWallet).mockReturnValue({
        evmAccount: undefined,
      })
      const component = render(<StatusIcon />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
      expect(component.queryByTestId('MiniIcon')).not.toBeInTheDocument()
    })
  })

  describe('with account', () => {
    beforeEach(() => {
      mocked(useWallet).mockReturnValue({
        evmAccount: {
          address: ACCOUNT,
          platform: Platform.EVM,
          accountType: AccountType.SignerMnemonic,
          walletMeta: {
            id: 'io.metamask',
            name: 'MetaMask',
            icon: 'metamask-icon.svg',
          },
        },
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
