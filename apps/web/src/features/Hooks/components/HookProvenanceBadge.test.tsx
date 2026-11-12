import userEvent from '@testing-library/user-event'
import { Flex, Text } from '@universe/mycelium'
import { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { HookProvenanceBadge } from '~/features/Hooks/components/HookProvenanceBadge'
import { fireEvent, render, screen } from '~/test-utils/render'

describe('HookProvenanceBadge', () => {
  it.each([
    {
      provenance: UniswapHookProvenance.Built,
      builderName: undefined,
      configurerName: 'Example partner',
      description: 'This hook has been built by Uniswap and configured by Example partner.',
    },
    {
      provenance: UniswapHookProvenance.Configured,
      builderName: 'Example partner',
      configurerName: undefined,
      description: 'This hook has been built by Example partner and configured by Uniswap.',
    },
    {
      provenance: UniswapHookProvenance.BuiltAndConfigured,
      builderName: undefined,
      configurerName: undefined,
      description: 'This hook has been built and configured by Uniswap.',
    },
  ])(
    'uses the one badge label and explains $provenance provenance',
    async ({ provenance, builderName, configurerName, description }) => {
      render(<HookProvenanceBadge provenance={provenance} builderName={builderName} configurerName={configurerName} />)

      const badge = screen.getByRole('button', { name: 'Built by Uniswap' })
      expect(badge).toHaveTextContent('Built by Uniswap')
      await userEvent.hover(badge)
      expect(await screen.findByText(description)).toBeInTheDocument()
      expect(screen.queryByText('Configured by Uniswap')).not.toBeInTheDocument()
      expect(screen.queryByText('Built and configured by Uniswap')).not.toBeInTheDocument()
    },
  )

  it.each([
    {
      provenance: UniswapHookProvenance.Built,
      description: 'Uniswap Labs built this hook. The deployment configurer is not listed.',
    },
    {
      provenance: UniswapHookProvenance.Configured,
      description: 'Uniswap Labs configured this hook’s deployment. The builder is not listed.',
    },
  ])('does not invent a missing partner for $provenance provenance', async ({ provenance, description }) => {
    render(<HookProvenanceBadge provenance={provenance} builderName="   " configurerName="   " />)

    await userEvent.hover(screen.getByRole('button', { name: 'Built by Uniswap' }))
    expect(await screen.findByText(description)).toBeInTheDocument()
  })

  it('keeps a custom provenance trigger accessible with the same partner explanation', async () => {
    render(
      <HookProvenanceBadge
        provenance={UniswapHookProvenance.Built}
        configurerName="Example partner"
        trigger={<Text>Custom mark</Text>}
      />,
    )

    const badge = screen.getByRole('button', { name: 'Built by Uniswap' })
    expect(badge.tagName).toBe('BUTTON')
    expect(badge).toContainElement(screen.getByText('Custom mark'))
    expect(screen.queryByText('Built by Uniswap')).not.toBeInTheDocument()
    await userEvent.hover(badge)
    expect(
      await screen.findByText('This hook has been built by Uniswap and configured by Example partner.'),
    ).toBeInTheDocument()
  })

  it('keeps isolated custom-trigger touch help usable without a row click', async () => {
    const onRowClick = vi.fn()
    render(
      <Flex onClick={onRowClick}>
        <HookProvenanceBadge
          provenance={UniswapHookProvenance.BuiltAndConfigured}
          trigger={
            <Flex minWidth={44} minHeight={44}>
              <Text>Custom mark</Text>
            </Flex>
          }
          isolateInteraction
        />
      </Flex>,
    )
    const badge = screen.getByRole('button', { name: 'Built by Uniswap' })
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperty(pointerDown, 'pointerType', { value: 'touch' })
    fireEvent(badge, pointerDown)
    expect(fireEvent.click(badge)).toBe(false)

    expect(await screen.findByText('This hook has been built and configured by Uniswap.')).toBeInTheDocument()
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
