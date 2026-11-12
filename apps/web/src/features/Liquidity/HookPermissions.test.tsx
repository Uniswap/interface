import userEvent from '@testing-library/user-event'
import { HookPermissions } from '~/features/Liquidity/HookPermissions'
import { fireEvent, render, screen, waitFor, within } from '~/test-utils/render'

const OPEN_HELP_SELECTOR = '[data-slot="tooltip-compat-popup"][data-open]'

const BEFORE_INITIALIZE_HELP =
  'Runs before a new pool using this hook is created, so the hook can check the pool’s settings and refuse pools it doesn’t allow.'

describe('HookPermissions', () => {
  it.each(['', '0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', '0x52908400098527886E0F7030069857D2E4169Ee7'])(
    'omits permissions for an invalid address: %s',
    (hookAddress) => {
      const { rerender } = render(<HookPermissions hookAddress={hookAddress} />)

      expect(screen.queryByRole('group', { name: 'Permissions' })).not.toBeInTheDocument()

      rerender(<HookPermissions hookAddress="0x0000000000000000000000000000000000000080" />)

      expect(screen.getByRole('button', { name: 'beforeSwap: Active' })).toBeInTheDocument()
    },
  )

  it('renders every permission in lifecycle order, including return-delta permissions', () => {
    render(<HookPermissions hookAddress="0x0000000000000000000000000000000000002004" />)

    const permissions = within(screen.getByRole('group', { name: 'Permissions' }))
      .getAllByRole('button')
      .slice(1)
    expect(permissions.map((button) => button.getAttribute('aria-label'))).toEqual([
      'beforeInitialize: Active',
      'afterInitialize: Inactive',
      'beforeAddLiquidity: Inactive',
      'afterAddLiquidity: Inactive',
      'beforeRemoveLiquidity: Inactive',
      'afterRemoveLiquidity: Inactive',
      'beforeSwap: Inactive',
      'afterSwap: Inactive',
      'beforeDonate: Inactive',
      'afterDonate: Inactive',
      'beforeSwapReturnDelta: Inactive',
      'afterSwapReturnDelta: Active',
      'afterAddLiquidityReturnDelta: Inactive',
      'afterRemoveLiquidityReturnDelta: Inactive',
    ])
  })

  it('renders all permissions as inactive when the address has no permission bits', () => {
    render(<HookPermissions hookAddress="0x0000000000000000000000000000000000004000" />)

    expect(screen.getAllByRole('button', { name: /: Inactive$/ })).toHaveLength(14)
    expect(screen.queryByRole('button', { name: /: Active$/ })).not.toBeInTheDocument()
  })

  it('updates the active statuses when the selected deployment changes', () => {
    const { rerender } = render(<HookPermissions hookAddress="0x0000000000000000000000000000000000000080" />)
    expect(screen.getByRole('button', { name: 'beforeSwap: Active' })).toBeInTheDocument()

    rerender(<HookPermissions hookAddress="0x0000000000000000000000000000000000000040" />)

    expect(screen.getByRole('button', { name: 'beforeSwap: Inactive' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'afterSwap: Active' })).toBeInTheDocument()
  })

  it('explains the section on focus and dismisses with Escape', async () => {
    render(<HookPermissions hookAddress="0x0000000000000000000000000000000000004000" />)

    const description =
      'Permissions determine which pool actions can call this hook. Active permissions are enabled for this deployment.'
    expect(screen.getByRole('button', { name: 'About permissions' })).toHaveAccessibleDescription(description)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'About permissions' })).toHaveFocus()
    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).toHaveTextContent(description))
    expect(screen.getByRole('button', { name: 'About permissions' })).toHaveAccessibleDescription(description)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).not.toBeInTheDocument())
  })

  it('explains an inactive permission on hover and keyboard focus', async () => {
    render(<HookPermissions hookAddress="0x0000000000000000000000000000000000004000" />)
    const button = screen.getByRole('button', { name: 'beforeInitialize: Inactive' })

    expect(button).toHaveAccessibleDescription(BEFORE_INITIALIZE_HELP)
    await userEvent.hover(button)
    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).toHaveTextContent(BEFORE_INITIALIZE_HELP))
    await userEvent.unhover(button)
    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).not.toBeInTheDocument())

    await userEvent.tab()
    await userEvent.tab()
    expect(button).toHaveFocus()
    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).toHaveTextContent(BEFORE_INITIALIZE_HELP))
    expect(button).toHaveAccessibleDescription(BEFORE_INITIALIZE_HELP)
  })

  it('opens inactive permission help on touch and dismisses on tap-away', async () => {
    render(<HookPermissions hookAddress="0x0000000000000000000000000000000000004000" />)
    const button = screen.getByRole('button', { name: 'beforeInitialize: Inactive' })
    for (const type of ['pointerdown', 'pointerup'] as const) {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'pointerType', { value: 'touch' })
      fireEvent(button, event)
    }
    fireEvent.click(button)

    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).toHaveTextContent(BEFORE_INITIALIZE_HELP))

    const tapAway = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperty(tapAway, 'pointerType', { value: 'touch' })
    fireEvent(document.body, tapAway)
    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).not.toBeInTheDocument())
  })
})
