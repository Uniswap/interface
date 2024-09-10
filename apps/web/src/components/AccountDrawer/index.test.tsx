import AccountDrawer, { DRAWER_WIDTH, MODAL_WIDTH } from 'components/AccountDrawer'
import { useIsUniExtensionAvailable, useUniswapWalletOptions } from 'hooks/useUniswapWalletOptions'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

jest.mock('hooks/useUniswapWalletOptions', () => ({
  useIsUniExtensionAvailable: jest.fn(),
  useUniswapWalletOptions: jest.fn(),
}))

describe('AccountDrawer tests', () => {
  it('AccountDrawer styles when isUniExtensionAvailable is false', () => {
    mocked(useUniswapWalletOptions).mockReturnValue(false)
    mocked(useIsUniExtensionAvailable).mockReturnValue(false)

    const { asFragment } = render(<AccountDrawer />)
    expect(asFragment()).toMatchSnapshot()
    const drawerWrapper = screen.getByTestId('account-drawer')
    expect(drawerWrapper).toBeInTheDocument()
    expect(drawerWrapper).toHaveStyleRule('width', DRAWER_WIDTH)
  })

  it('AccountDrawer styles when isUniExtensionAvailable is true', () => {
    mocked(useUniswapWalletOptions).mockReturnValue(true)
    mocked(useIsUniExtensionAvailable).mockReturnValue(true)

    const { asFragment } = render(<AccountDrawer />)
    expect(asFragment()).toMatchSnapshot()
    const drawerWrapper = screen.getByTestId('account-drawer')
    expect(drawerWrapper).toBeInTheDocument()
    expect(drawerWrapper).toHaveStyleRule('width', MODAL_WIDTH)
  })
})
