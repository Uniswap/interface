import userEvent from '@testing-library/user-event'
import { TestID } from '@universe/test'
import { describe, expect, it, vi } from 'vitest'
import { MobileHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/MobileHeaderActions'
import type { HeaderAction, HeaderActionSection } from '~/components/StickyCollapsibleHeader/HeaderActions/types'
import { render, screen, within } from '~/test-utils/render'

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

  // Queries are scoped to the open menu: the dropdown also renders a hidden measuring copy of its content.
  describe('dropdown (default)', () => {
    it('opens an anchored menu with section titles and actions when the more button is pressed', async () => {
      const user = userEvent.setup()
      const actionSections: HeaderActionSection[] = [
        { title: 'Details', actions: [createSimpleAction({ title: 'Explorer' })] },
        { title: 'Share', actions: [createSimpleAction({ title: 'Copy link' })] },
      ]
      render(<MobileHeaderActions actionSections={actionSections} />)
      await user.click(screen.getByTestId(TestID.HeaderActionsMoreButton))

      const menu = screen.getByTestId(TestID.HeaderActionsMenu)
      expect(within(menu).getByText('Share')).toBeInTheDocument()
      expect(within(menu).getByText('Explorer')).toBeInTheDocument()
      expect(within(menu).getByText('Copy link')).toBeInTheDocument()
      expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    })

    it('calls onPress and closes when clicking an action without href', async () => {
      const user = userEvent.setup()
      const onPress = vi.fn()
      const actionSections: HeaderActionSection[] = [
        { title: 'Details', actions: [createSimpleAction({ title: 'Custom action', onPress })] },
      ]
      render(<MobileHeaderActions actionSections={actionSections} />)
      await user.click(screen.getByTestId(TestID.HeaderActionsMoreButton))
      await user.click(within(screen.getByTestId(TestID.HeaderActionsMenu)).getByText('Custom action'))

      expect(onPress).toHaveBeenCalledTimes(1)
      expect(mockOpenExternalLink).not.toHaveBeenCalled()
      expect(screen.queryByTestId(TestID.HeaderActionsMenu)).not.toBeInTheDocument()
    })

    it('calls openExternalLink when clicking an action with href', async () => {
      const user = userEvent.setup()
      const actionSections: HeaderActionSection[] = [
        {
          title: 'Details',
          actions: [createSimpleAction({ title: 'Explorer', href: 'https://etherscan.io', onPress: () => {} })],
        },
      ]
      render(<MobileHeaderActions actionSections={actionSections} />)
      await user.click(screen.getByTestId(TestID.HeaderActionsMoreButton))
      await user.click(within(screen.getByTestId(TestID.HeaderActionsMenu)).getByText('Explorer'))
      expect(mockOpenExternalLink).toHaveBeenCalledWith('https://etherscan.io')
    })

    it('does not render actions with show false', async () => {
      const user = userEvent.setup()
      const actionSections: HeaderActionSection[] = [
        {
          title: 'Details',
          actions: [createSimpleAction({ title: 'Visible' }), createSimpleAction({ title: 'Hidden', show: false })],
        },
      ]
      render(<MobileHeaderActions actionSections={actionSections} />)
      await user.click(screen.getByTestId(TestID.HeaderActionsMoreButton))
      expect(within(screen.getByTestId(TestID.HeaderActionsMenu)).getByText('Visible')).toBeInTheDocument()
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    })
  })

  describe('sheet presentation', () => {
    it('renders section titles and actions in the sheet', () => {
      const actionSections: HeaderActionSection[] = [
        { title: 'Details', actions: [createSimpleAction({ title: 'Explorer' })] },
        { title: 'Share', actions: [createSimpleAction({ title: 'Copy link' })] },
      ]
      render(<MobileHeaderActions actionSections={actionSections} presentation="sheet" />)
      // Sheet content is rendered in a portal even while closed
      expect(screen.getByText('Details')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
      expect(screen.getByText('Explorer')).toBeInTheDocument()
      expect(screen.getByText('Copy link')).toBeInTheDocument()
    })

    it('calls onPress when clicking an action without href', async () => {
      const user = userEvent.setup()
      const onPress = vi.fn()
      const actionSections: HeaderActionSection[] = [
        { title: 'Details', actions: [createSimpleAction({ title: 'Custom action', onPress })] },
      ]
      render(<MobileHeaderActions actionSections={actionSections} presentation="sheet" />)
      await user.click(screen.getByText('Custom action'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })
})
