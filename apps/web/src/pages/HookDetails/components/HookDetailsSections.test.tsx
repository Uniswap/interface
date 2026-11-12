import userEvent from '@testing-library/user-event'
import { UniverseChainId } from '@universe/chains'
import { Flex, Text, useMedia } from '@universe/mycelium'
import type { ComponentProps } from 'react'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { HookDetailsPoolsTable } from '~/pages/HookDetails/components/HookDetailsPoolsTable'
import { HookDetailsSections } from '~/pages/HookDetails/components/HookDetailsSections'
import { fireEvent, render, screen, within } from '~/test-utils/render'

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useMedia: vi.fn(),
}))

vi.mock('~/pages/HookDetails/components/HookDetailsPoolsTable', () => ({
  HookDetailsPoolsTable: vi.fn(({ headingId }: ComponentProps<typeof HookDetailsPoolsTable>) => (
    <Flex>
      <Text tag="h2" id={headingId}>
        Pools
      </Text>
      <Text>Selected deployment pools</Text>
    </Flex>
  )),
}))

vi.mock('~/features/Explore/VolumeTimeFrameSelector', () => ({
  VolumeTimeFrameSelector: vi.fn(() => <button>Choose pool period</button>),
}))

const CONTENT = {
  deployment: { chainId: UniverseChainId.Base, address: '0x1111111111111111111111111111111111111111' },
  isFixture: true,
  description: 'Hook description.',
  descriptionGeneratedByAi: false,
  deployments: [
    { chainId: UniverseChainId.Base, address: '0x1111111111111111111111111111111111111111', deployerAddress: null },
  ],
}

describe('HookDetailsSections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMedia).mockReturnValue({ md: true } as ReturnType<typeof useMedia>)
  })

  it.each([false, true])('renders the supplied permissions in Info at the mobile breakpoint %s', (md) => {
    vi.mocked(useMedia).mockReturnValue({ md } as ReturnType<typeof useMedia>)
    render(
      <HookDetailsSections
        {...CONTENT}
        deployment={{ ...CONTENT.deployment, address: '0x0000000000000000000000000000000000000080' }}
      />,
    )

    const permissions = within(screen.getByRole('group', { name: 'Permissions' }))
    expect(permissions.getByRole('button', { name: 'beforeSwap: Active' })).toBeInTheDocument()
    expect(permissions.getByRole('button', { name: 'afterSwap: Inactive' })).toBeInTheDocument()
    expect(screen.queryByText('Permissions information is unavailable.')).not.toBeInTheDocument()
    const createPool = screen.getByRole('link', { name: 'Create a pool' })
    expect(createPool).toHaveAttribute(
      'href',
      '/positions/add/new?chain=base&hook=0x0000000000000000000000000000000000000080&protocolVersion=v4&entryPoint=%2Fexplore%2Fhooks%2Fbase%2F0x0000000000000000000000000000000000000080',
    )
    expect(
      screen.getByRole('group', { name: 'Permissions' }).compareDocumentPosition(createPool) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it.each([false, true])('passes the selected deployment and fixture mode to the pool table (%s)', (isFixture) => {
    render(<HookDetailsSections {...CONTENT} isFixture={isFixture} />)

    expect(vi.mocked(HookDetailsPoolsTable).mock.lastCall?.[0]).toMatchObject({
      deployment: CONTENT.deployment,
      isFixture,
      headingId: expect.any(String),
    })
  })

  it('uses native roving tabs and associated panels on mobile', async () => {
    render(<HookDetailsSections {...CONTENT} />)
    const info = screen.getByRole('tab', { name: 'Info' })
    const pools = screen.getByRole('tab', { name: 'Pools' })

    expect(screen.queryByRole('button', { name: 'Choose pool period' })).not.toBeInTheDocument()
    expect(VolumeTimeFrameSelector).not.toHaveBeenCalled()
    expect(info.tagName).toBe('BUTTON')
    expect(info).toHaveAttribute('aria-selected', 'true')
    expect(info).toHaveAttribute('tabindex', '0')
    expect(pools).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tabpanel', { name: 'Info' })).toHaveAttribute('id', info.getAttribute('aria-controls'))
    await userEvent.click(pools)

    expect(pools).toHaveFocus()
    const period = screen.getByRole('button', { name: 'Choose pool period' })
    expect(period.closest('[role=tablist]')).toBeNull()
    expect(period.parentElement).toBe(pools.closest('[role=tablist]')?.parentElement)
    expect(pools).toHaveAttribute('aria-selected', 'true')
    expect(pools).toHaveAttribute('tabindex', '0')
    expect(info).toHaveAttribute('tabindex', '-1')
    expect(screen.queryByRole('tabpanel', { name: 'Info' })).not.toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: 'Pools' })).toHaveAttribute('id', pools.getAttribute('aria-controls'))
    expect(screen.getByRole('tabpanel', { name: 'Pools' })).toHaveTextContent('Selected deployment pools')
  })

  it('moves keyboard selection and focus with wrapping arrows, Home and End', () => {
    render(<HookDetailsSections {...CONTENT} />)
    const info = screen.getByRole('tab', { name: 'Info' })
    const pools = screen.getByRole('tab', { name: 'Pools' })

    fireEvent.keyDown(info, { key: 'ArrowLeft' })
    expect(pools).toHaveFocus()
    expect(pools).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(pools, { key: 'ArrowRight' })
    expect(info).toHaveFocus()
    fireEvent.keyDown(info, { key: 'End' })
    expect(pools).toHaveFocus()
    fireEvent.keyDown(pools, { key: 'Home' })
    expect(info).toHaveFocus()
    expect(info).toHaveAttribute('aria-selected', 'true')
  })

  it('shows both desktop sections and preserves the selected mobile panel across breakpoint changes', async () => {
    const { rerender } = render(<HookDetailsSections {...CONTENT} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Pools' }))
    vi.mocked(useMedia).mockReturnValue({ md: false } as ReturnType<typeof useMedia>)
    rerender(<HookDetailsSections {...CONTENT} />)

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Choose pool period' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Info' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pools' })).toBeInTheDocument()
    expect(screen.getByText('Hook description.')).toBeInTheDocument()
    expect(screen.getByText('Contract')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Permissions' })).toBeInTheDocument()
    vi.mocked(useMedia).mockReturnValue({ md: true } as ReturnType<typeof useMedia>)
    rerender(<HookDetailsSections {...CONTENT} />)

    expect(screen.getByRole('tab', { name: 'Pools' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Pools' })).toBeInTheDocument()
    expect(screen.queryByRole('tabpanel', { name: 'Info' })).not.toBeInTheDocument()
  })
})
