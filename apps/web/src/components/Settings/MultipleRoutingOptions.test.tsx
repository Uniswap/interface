import { ChainId } from '@taraswap/sdk-core'
import MultipleRoutingOptions from 'components/Settings/MultipleRoutingOptions'
import { useAccount } from 'hooks/useAccount'
import { Provider } from 'jotai'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen, waitFor } from 'test-utils/render'

jest.mock('hooks/useAccount')

describe('Multiple routing options', () => {
  beforeEach(() => {
    mocked(useAccount).mockReturnValue({
      chainId: ChainId.MAINNET,
    } as unknown as ReturnType<typeof useAccount>)
  })

  it('optimal routing is enabled by default', () => {
    render(
      <Provider>
        <MultipleRoutingOptions chainId={ChainId.MAINNET} />
      </Provider>
    )

    expect(screen.getByTestId('route-preference-toggle-Optimal')).toBeInTheDocument()
    expect(screen.queryByTestId('route-preference-toggle-v3')).toBeFalsy()
    expect(screen.queryByTestId('route-preference-toggle-v2')).toBeFalsy()
    expect(screen.queryByTestId('route-preference-toggle-UniswapX')).toBeFalsy()
  })

  it('when optimal routing is toggled other toggles are enabled', async () => {
    render(
      <Provider>
        <MultipleRoutingOptions chainId={ChainId.MAINNET} />
      </Provider>
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
        <MultipleRoutingOptions chainId={ChainId.MAINNET} />
      </Provider>
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
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveStyleRule('pointer-events', 'none')

    const uniswapXToggle = screen.getByTestId('route-preference-toggle-UniswapX')
    fireEvent.click(uniswapXToggle)

    expect(screen.getByTestId('route-preference-toggle-Optimal')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v3')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('route-preference-toggle-UniswapX')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('route-preference-toggle-v2')).toHaveStyleRule('pointer-events', 'none')
  })

  it('does not render uniswapx toggle when uniswapx is not enabled', async () => {
    render(
      <Provider>
        <MultipleRoutingOptions chainId={ChainId.OPTIMISM} />
      </Provider>
    )

    expect(screen.queryByTestId('route-preference-toggle-UniswapX')).toBeFalsy()
  })
})
