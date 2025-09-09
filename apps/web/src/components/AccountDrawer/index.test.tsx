import AccountDrawer, { MODAL_WIDTH } from 'components/AccountDrawer'
import { useIsUniExtensionConnected } from 'hooks/useIsUniExtensionConnected'
import mockMediaSize from 'test-utils/mockMediaSize'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

vi.mock('hooks/useIsUniExtensionConnected', () => ({
  useIsUniExtensionConnected: vi.fn(),
}))

vi.mock('tamagui', async () => {
  const actual = await vi.importActual('tamagui')
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

vi.mock('uniswap/src/components/AnimatedNumber/AnimatedNumber', () => {
  const mockAnimatedNumber = ({ value }: { value: number }) => {
    return <div>{value}</div>
  }
  return {
    BALANCE_CHANGE_INDICATION_DURATION: 1000,
    default: mockAnimatedNumber,
    AnimatedNumber: mockAnimatedNumber,
  }
})

describe('AccountDrawer tests', () => {
  it('AccountDrawer default styles', () => {
    mocked(useIsUniExtensionConnected).mockReturnValue(true)
    mockMediaSize('xxl')

    render(<AccountDrawer />)
    expect(document.body).toMatchSnapshot()
    const drawerWrapper = screen.getByTestId('account-drawer')
    expect(drawerWrapper).toBeInTheDocument()
    expect(drawerWrapper).toHaveClass(`_width-${MODAL_WIDTH}`)
  })
})
