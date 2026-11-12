import userEvent from '@testing-library/user-event'
import { Flex, Text } from '@universe/mycelium'
import { Link } from 'react-router'
import { HookStatusTooltip } from '~/features/Hooks/components/HookStatusTooltip'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

describe('HookStatusTooltip', () => {
  it('lets touch help open before isolating the row click and still supports tap-away', async () => {
    const onRowClick = vi.fn()
    window.history.replaceState({}, '', '/explore/hooks')
    render(
      <Flex row onClick={onRowClick}>
        <Link to="/explore/hooks/ethereum/0x1111111111111111111111111111111111111111">Hook detail</Link>
        <HookStatusTooltip label="Hook help" description="Hook explanation" isolateInteraction>
          <Flex minWidth={44} minHeight={44} alignItems="flex-end">
            <Text>—</Text>
          </Flex>
        </HookStatusTooltip>
      </Flex>,
    )
    const button = screen.getByRole('button', { name: 'Hook help' })
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperty(pointerDown, 'pointerType', { value: 'touch' })
    fireEvent(button, pointerDown)
    expect(screen.queryByText('Hook explanation')).not.toBeInTheDocument()
    expect(fireEvent.click(button)).toBe(false)

    expect(await screen.findByText('Hook explanation')).toBeInTheDocument()
    expect(onRowClick).not.toHaveBeenCalled()
    expect(window.location.pathname).toBe('/explore/hooks')
    expect(button.closest('a')).toBeNull()
    const tapAway = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperty(tapAway, 'pointerType', { value: 'touch' })
    fireEvent(document.body, tapAway)
    await waitFor(() => expect(screen.queryByText('Hook explanation')).not.toBeInTheDocument())
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('keeps keyboard help and the sibling native link independently usable', async () => {
    const onRowClick = vi.fn()
    const destination = '/explore/hooks/ethereum/0x1111111111111111111111111111111111111111'
    window.history.replaceState({}, '', '/explore/hooks')
    render(
      <Flex row onClick={onRowClick}>
        <Link to={destination}>Hook detail</Link>
        <HookStatusTooltip label="Hook help" description="Hook explanation" isolateInteraction>
          <Text>Help</Text>
        </HookStatusTooltip>
      </Flex>,
    )

    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Hook detail' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Hook help' })).toHaveFocus()
    expect(await screen.findByText('Hook explanation')).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onRowClick).not.toHaveBeenCalled()
    expect(window.location.pathname).toBe('/explore/hooks')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('Hook explanation')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('link', { name: 'Hook detail' }))
    expect(window.location.pathname).toBe(destination)
    expect(onRowClick).toHaveBeenCalledOnce()
  })

  it('preserves ordinary click propagation when isolation is omitted', () => {
    const onClick = vi.fn()
    render(
      <Flex onClick={onClick}>
        <HookStatusTooltip label="Hook help" description="Hook explanation">
          <Text>Help</Text>
        </HookStatusTooltip>
      </Flex>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hook help' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
