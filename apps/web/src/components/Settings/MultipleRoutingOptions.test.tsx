import MultipleRoutingOptions from 'components/Settings/MultipleRoutingOptions'
import { isUniswapXSupportedChain } from 'constants/chains'
import { Provider } from 'jotai'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen, waitFor } from 'test-utils/render'

jest.mock('constants/chains')

describe('Multiple routing options', () => {
  it('optimal routing is enabled by default', () => {
    mocked(isUniswapXSupportedChain).mockReturnValue(true)
    render(
      <Provider>
        <MultipleRoutingOptions />
      </Provider>
    )

    expect(screen.getByTestId('route-preference-toggle-Optimal')).toBeInTheDocument()
    expect(screen.queryByTestId('route-preference-toggle-v3')).toBeFalsy()
    expect(screen.queryByTestId('route-preference-toggle-v2')).toBeFalsy()
    expect(screen.queryByTestId('route-preference-toggle-UniswapX')).toBeFalsy()
  })

  it('when optimal routing is toggled other toggles are enabled', async () => {
    mocked(isUniswapXSupportedChain).mockReturnValue(true)
    render(
      <Provider>
        <MultipleRoutingOptions />
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
    mocked(isUniswapXSupportedChain).mockReturnValue(true)
    render(
      <Provider>
        <MultipleRoutingOptions />
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
    mocked(isUniswapXSupportedChain).mockReturnValue(false)
    render(
      <Provider>
        <MultipleRoutingOptions />
      </Provider>
    )

    expect(screen.queryByTestId('route-preference-toggle-UniswapX')).toBeFalsy()
  })
})
