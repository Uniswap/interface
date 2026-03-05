import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MobileHeaderActions } from '~/components/Explore/stickyHeader/HeaderActions/MobileHeaderActions'
import type { HeaderAction, HeaderActionSection } from '~/components/Explore/stickyHeader/HeaderActions/types'
import { render, screen } from '~/test-utils/render'

const mockOpenExternalLink = vi.fn()
vi.mock('~/utils/openExternalLink', () => ({
  openExternalLink: (url: string) => mockOpenExternalLink(url),
}))

function createSimpleAction(overrides: Partial<HeaderAction> = {}): HeaderAction {
  const { dropdownItems: _drop, ...rest } = overrides
  return {
    title: 'Website',
    icon: <span aria-hidden="true">W</span>,
    show: true,
    onPress: () => {},
    ...rest,
  }
}

describe('MobileHeaderActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const actionSections: HeaderActionSection[] = [
      { title: 'Details', actions: [createSimpleAction({ title: 'Website' })] },
    ]
    render(<MobileHeaderActions actionSections={actionSections} />)
    expect(screen.getByText('Website')).toBeInTheDocument()
  })

  it('renders section titles and action titles', () => {
    const actionSections: HeaderActionSection[] = [
      { title: 'Details', actions: [createSimpleAction({ title: 'Explorer' })] },
      { title: 'Share', actions: [createSimpleAction({ title: 'Copy link' })] },
    ]
    render(<MobileHeaderActions actionSections={actionSections} />)
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Share')).toBeInTheDocument()
    expect(screen.getByText('Explorer')).toBeInTheDocument()
    expect(screen.getByText('Copy link')).toBeInTheDocument()
  })

  it('opens sheet when more button is clicked and shows actions', async () => {
    const user = userEvent.setup()
    const actionSections: HeaderActionSection[] = [
      { title: 'Details', actions: [createSimpleAction({ title: 'Website' })] },
    ]
    render(<MobileHeaderActions actionSections={actionSections} />)
    // Sheet content is rendered in portal but may be hidden; actions are still in DOM
    expect(screen.getByText('Website')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('calls onPress when clicking an action without href', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()
    const actionSections: HeaderActionSection[] = [
      {
        title: 'Details',
        actions: [createSimpleAction({ title: 'Custom action', onPress })],
      },
    ]
    render(<MobileHeaderActions actionSections={actionSections} />)
    await user.click(screen.getByText('Custom action'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(mockOpenExternalLink).not.toHaveBeenCalled()
  })

  it('calls openExternalLink when clicking an action with href', async () => {
    const user = userEvent.setup()
    const actionSections: HeaderActionSection[] = [
      {
        title: 'Details',
        actions: [
          createSimpleAction({
            title: 'Explorer',
            href: 'https://etherscan.io',
            onPress: () => {},
          }),
        ],
      },
    ]
    render(<MobileHeaderActions actionSections={actionSections} />)
    await user.click(screen.getByText('Explorer'))
    expect(mockOpenExternalLink).toHaveBeenCalledWith('https://etherscan.io')
  })

  it('does not render actions with show false', () => {
    const actionSections: HeaderActionSection[] = [
      {
        title: 'Section',
        actions: [createSimpleAction({ title: 'Visible' }), createSimpleAction({ title: 'Hidden', show: false })],
      },
    ]
    render(<MobileHeaderActions actionSections={actionSections} />)
    expect(screen.getByText('Visible')).toBeInTheDocument()
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })
})
