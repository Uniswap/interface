import AccountDrawer, { MODAL_WIDTH } from 'components/AccountDrawer'
import { useIsUniExtensionConnected } from 'hooks/useIsUniExtensionConnected'
import mockMediaSize from 'test-utils/mockMediaSize'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

jest.mock('hooks/useIsUniExtensionConnected', () => ({
  useIsUniExtensionConnected: jest.fn(),
}))

jest.mock('tamagui', () => ({
  ...jest.requireActual('tamagui'),
  useMedia: jest.fn(),
}))

describe('AccountDrawer tests', () => {
  it('AccountDrawer default styles', () => {
    mocked(useIsUniExtensionConnected).mockReturnValue(true)
    mockMediaSize('xxl')

    const { asFragment } = render(<AccountDrawer />)
    expect(asFragment()).toMatchSnapshot()
    const drawerWrapper = screen.getByTestId('account-drawer')
    expect(drawerWrapper).toBeInTheDocument()
    expect(drawerWrapper).toHaveClass(`_width-${MODAL_WIDTH}`)
  })
})
