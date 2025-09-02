import { useAccount } from 'hooks/useAccount'
import { Provider } from 'jotai'
import MultipleRoutingOptions from 'pages/MigrateV2/Settings/MultipleRoutingOptions'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen, waitFor } from 'test-utils/render'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

vi.mock('hooks/useAccount')

describe('Multiple routing options', () => {
  beforeEach(() => {
    mocked(useAccount).mockReturnValue({
      chainId: UniverseChainId.Mainnet,
    } as unknown as ReturnType<typeof useAccount>)
  })

  it('optimal routing is enabled by default', () => {
    render(
      <Provider>
        <MultipleRoutingOptions chainId={UniverseChainId.Mainnet} />
      </Provider>,
    )

    expect(screen.getByTestId('route-preference-toggle-Optimal')).toBeInTheDocument()
    expect(screen.queryByTestId('route-preference-toggle-v3')).toBeFalsy()
    expect(screen.queryByTestId('route-preference-toggle-v2')).toBeFalsy()
    expect(screen.queryByTestId('route-preference-toggle-UniswapX')).toBeFalsy()
  })

  it('when optimal routing is toggled other toggles are enabled', async () => {
    render(
      <Provider>
        <MultipleRoutingOptions chainId={UniverseChainId.Mainnet} />
      </Provider>,
    )

    const optimalToggle = screen.getByTestId('route-preference-toggle-Optimal')
    fireEvent.click(optimalToggle)

    await waitFor(() => {
      expect(screen.getByTestId('route-preference-toggle-v3')).toBeInTheDocument()
      expect(screen.getByTestId('route-preference-toggle-v2')).toBeInTheDocument()
      expect(screen.getByTestId('route-preference-toggle-UniswapX')).toBeInTheDocument()
    })

    expect(screen.getByTestId('route-preference-toggle-Optimal')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v3')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('route-preference-toggle-UniswapX')).toHaveAttribute('aria-selected', 'true')
  })

  it('can only deselect one pool at a time', async () => {
    render(
      <Provider>
        <MultipleRoutingOptions chainId={UniverseChainId.Mainnet} />
      </Provider>,
    )

    const optimalToggle = screen.getByTestId('route-preference-toggle-Optimal')
    fireEvent.click(optimalToggle)

    await waitFor(() => {
      expect(screen.getByTestId('route-preference-toggle-v3')).toBeInTheDocument()
      expect(screen.getByTestId('route-preference-toggle-v2')).toBeInTheDocument()
      expect(screen.getByTestId('route-preference-toggle-UniswapX')).toBeInTheDocument()
    })

    const v3Toggle = screen.getByTestId('route-preference-toggle-v3')
    fireEvent.click(v3Toggle)

    expect(screen.getByTestId('route-preference-toggle-Optimal')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v3')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('route-preference-toggle-UniswapX')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveAttribute('aria-disabled', 'true')

    const uniswapXToggle = screen.getByTestId('route-preference-toggle-UniswapX')
    fireEvent.click(uniswapXToggle)

    expect(screen.getByTestId('route-preference-toggle-Optimal')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v3')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('route-preference-toggle-UniswapX')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not render uniswapx toggle when uniswapx is not enabled', async () => {
    render(
      <Provider>
        <MultipleRoutingOptions chainId={UniverseChainId.Optimism} />
      </Provider>,
    )

    expect(screen.queryByTestId('route-preference-toggle-UniswapX')).toBeFalsy()
  })
})
