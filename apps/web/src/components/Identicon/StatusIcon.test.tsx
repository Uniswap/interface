import StatusIcon from 'components/Identicon/StatusIcon'
import { useAccount } from 'hooks/useAccount'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

const ACCOUNT = '0x0'

jest.mock('hooks/useAccount')
jest.mock('uniswap/src/features/unitags/hooks', () => ({
  useUnitagByAddress: () => ({ unitag: undefined, loading: false }),
}))

jest.mock('../../hooks/useSocksBalance', () => ({
  useHasSocks: () => true,
}))

describe('StatusIcon', () => {
  describe('with no account', () => {
    it('renders children in correct order', () => {
      mocked(useAccount).mockReturnValue({
        address: undefined,
        connector: undefined,
      } as unknown as ReturnType<typeof useAccount>)
      const component = render(<StatusIcon />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
      expect(component.queryByTestId('MiniIcon')).not.toBeInTheDocument()
    })
  })

  describe('with account', () => {
    it('renders children in correct order', () => {
      jest.spyOn(console, 'error').mockImplementation(() => null)
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT,
        connector: { id: 'io.metamask' },
      } as unknown as ReturnType<typeof useAccount>)

      const component = render(<StatusIcon />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
      expect(component.getByTestId('MiniIcon')).toBeInTheDocument()
    })
  })

  it('renders without mini icons', async () => {
    mocked(useAccount).mockReturnValue({
      address: ACCOUNT,
      connector: { id: 'io.metamask' },
    } as unknown as ReturnType<typeof useAccount>)

    const component = render(<StatusIcon showMiniIcons={false} />)
    expect(component.queryByTestId('MiniIcon')).not.toBeInTheDocument()
  })
})
