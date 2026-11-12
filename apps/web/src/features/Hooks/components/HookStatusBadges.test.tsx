import userEvent from '@testing-library/user-event'
import { Flex } from '@universe/mycelium'
import { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { HookStatusBadges } from '~/features/Hooks/components/HookStatusBadges'
import { HookRoutingStatus, HookSourceVerification } from '~/features/Hooks/types'
import { fireEvent, render, screen } from '~/test-utils/render'

describe('HookStatusBadges', () => {
  it('keeps verified source independent from unknown routing and provenance', () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Verified}
        routingStatus={HookRoutingStatus.Unknown}
        builderName="A partner"
      />,
    )

    expect(screen.getByRole('button', { name: 'Verified source' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Routing status unavailable' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Routing allowlisted' })).not.toBeInTheDocument()
    expect(screen.queryByText('Built by Uniswap')).not.toBeInTheDocument()
  })

  it('keeps routing allowlisting independent from source verification', () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Unverified}
        routingStatus={HookRoutingStatus.Supported}
      />,
    )

    expect(screen.getByRole('button', { name: 'Routing allowlisted' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Source not verified' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Verified source' })).not.toBeInTheDocument()
  })

  it('shows unknown source as not verified with an evaluation explanation', async () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Unknown}
        routingStatus={HookRoutingStatus.Supported}
      />,
    )

    expect(screen.getByRole('button', { name: 'Routing allowlisted' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Source not verified' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Verified source' })).not.toBeInTheDocument()
    await userEvent.hover(screen.getByRole('button', { name: 'Source not verified' }))
    expect(await screen.findByText('Still needs evaluation')).toBeInTheDocument()
  })

  it('composes the shared provenance badge with independent source and routing controls', async () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Verified}
        routingStatus={HookRoutingStatus.Supported}
        provenance={UniswapHookProvenance.Configured}
        builderName="Example partner"
      />,
    )

    expect(screen.getByRole('button', { name: 'Verified source' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Routing allowlisted' })).toBeInTheDocument()
    await userEvent.hover(screen.getByRole('button', { name: 'Built by Uniswap' }))
    expect(
      await screen.findByText('This hook has been built by Example partner and configured by Uniswap.'),
    ).toBeInTheDocument()
  })

  it('exposes the source explanation on keyboard focus', async () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Verified}
        routingStatus={HookRoutingStatus.Unknown}
      />,
    )

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Verified source' })).toHaveFocus()
    expect(
      await screen.findByText('This hook’s code is published on block explorers and matches the bytecode.'),
    ).toBeInTheDocument()
  })

  it('opens a routing explanation on touch', async () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Verified}
        routingStatus={HookRoutingStatus.Unsupported}
      />,
    )
    const button = screen.getByRole('button', { name: 'Routing not allowlisted' })
    const explanation = 'This hook is not allowlisted for Uniswap routing.'

    // jsdom treats userEvent's touch focus as :focus-visible; mirror the compat tap helper instead.
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperty(pointerDown, 'pointerType', { value: 'touch' })
    fireEvent(button, pointerDown)
    expect(screen.queryByText(explanation)).not.toBeInTheDocument()
    fireEvent.click(button)

    expect(await screen.findByText(explanation)).toBeInTheDocument()
  })

  it.each([
    [HookSourceVerification.Unverified, HookRoutingStatus.Unsupported],
    [HookSourceVerification.Unverified, HookRoutingStatus.Unknown],
    [HookSourceVerification.Unknown, HookRoutingStatus.Unsupported],
    [HookSourceVerification.Unknown, HookRoutingStatus.Unknown],
  ] as const)(
    'hides unqualified list statuses without changing detail defaults (%s, %s)',
    (sourceVerification, routingStatus) => {
      render(<HookStatusBadges sourceVerification={sourceVerification} routingStatus={routingStatus} positiveOnly />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    },
  )

  it('hides unknown source in positive-only lists without hiding supported routing', () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Unknown}
        routingStatus={HookRoutingStatus.Supported}
        positiveOnly
      />,
    )

    expect(screen.getByRole('button', { name: 'Routing allowlisted' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Source not verified' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Verified source' })).not.toBeInTheDocument()
  })

  it('keeps independent positive list statuses visible', () => {
    render(
      <HookStatusBadges
        sourceVerification={HookSourceVerification.Verified}
        routingStatus={HookRoutingStatus.Unknown}
        positiveOnly
      />,
    )

    expect(screen.getByRole('button', { name: 'Verified source' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Routing status unavailable' })).not.toBeInTheDocument()
  })

  it('isolates source and routing help through the shared tooltip boundary', async () => {
    const onRowClick = vi.fn()
    render(
      <Flex onClick={onRowClick}>
        <HookStatusBadges
          sourceVerification={HookSourceVerification.Verified}
          routingStatus={HookRoutingStatus.Supported}
          positiveOnly
          isolateInteraction
        />
      </Flex>,
    )
    const button = screen.getByRole('button', { name: 'Routing allowlisted' })
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperty(pointerDown, 'pointerType', { value: 'touch' })
    fireEvent(button, pointerDown)
    expect(fireEvent.click(button)).toBe(false)

    expect(
      await screen.findByText('Uniswap and Uniswap Trading API routes swaps through this hook’s pools.'),
    ).toBeInTheDocument()
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
