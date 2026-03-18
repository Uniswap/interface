import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DesktopHeaderActions } from '~/components/Explore/stickyHeader/HeaderActions/DesktopHeaderActions'
import type { HeaderAction } from '~/components/Explore/stickyHeader/HeaderActions/types'
import { render, screen } from '~/test-utils/render'

const mockOpenExternalLink = vi.fn()
vi.mock('~/utils/openExternalLink', () => ({
  openExternalLink: (url: string) => mockOpenExternalLink(url),
}))

function createSimpleAction(overrides: Partial<HeaderAction> = {}): HeaderAction {
  const { dropdownItems: _drop, ...rest } = overrides
  return {
    title: 'Explorer',
    icon: <span aria-hidden="true">E</span>,
    show: true,
    href: 'https://etherscan.io',
    onPress: () => {},
    ...rest,
  }
}

describe('DesktopHeaderActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const actions: HeaderAction[] = [createSimpleAction()]
    render(<DesktopHeaderActions actions={actions} />)
    expect(screen.getByText('E')).toBeInTheDocument()
  })

  it('renders all visible actions', () => {
    const actions: HeaderAction[] = [
      createSimpleAction({ title: 'Explorer', icon: <span aria-hidden="true">E</span> }),
      createSimpleAction({
        title: 'Website',
        icon: <span aria-hidden="true">W</span>,
        href: 'https://example.com',
      }),
    ]
    render(<DesktopHeaderActions actions={actions} />)
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(screen.getByText('W')).toBeInTheDocument()
  })

  it('does not render actions with show false', () => {
    const actions: HeaderAction[] = [
      createSimpleAction({ title: 'Visible', icon: <span aria-hidden="true">V</span> }),
      createSimpleAction({
        title: 'Hidden',
        icon: <span aria-hidden="true">H</span>,
        show: false,
      }),
    ]
    render(<DesktopHeaderActions actions={actions} />)
    expect(screen.getByText('V')).toBeInTheDocument()
    expect(screen.queryByText('H')).not.toBeInTheDocument()
  })

  it('calls openExternalLink when clicking an action with href', async () => {
    const user = userEvent.setup()
    const actions: HeaderAction[] = [
      createSimpleAction({
        title: 'Explorer',
        icon: <span aria-hidden="true">E</span>,
        href: 'https://etherscan.io/tx/0x123',
      }),
    ]
    render(<DesktopHeaderActions actions={actions} />)
    await user.click(screen.getByText('E'))
    expect(mockOpenExternalLink).toHaveBeenCalledWith('https://etherscan.io/tx/0x123')
  })

  it('calls onPress when clicking an action without href', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()
    const actions: HeaderAction[] = [
      createSimpleAction({
        title: 'Custom',
        icon: <span aria-hidden="true">C</span>,
        href: undefined,
        onPress,
      }),
    ]
    render(<DesktopHeaderActions actions={actions} />)
    await user.click(screen.getByText('C'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(mockOpenExternalLink).not.toHaveBeenCalled()
  })
})
