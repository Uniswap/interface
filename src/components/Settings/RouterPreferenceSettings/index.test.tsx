import store from 'state'
import { RouterPreference } from 'state/routing/slice'
import { updateUserRouterPreference } from 'state/user/reducer'
import { fireEvent, render, screen } from 'test-utils/render'

import RouterPreferenceSettings from '.'

jest.mock('featureFlags/flags/uniswapx', () => ({
  useUniswapXEnabled: () => true,
}))

describe('RouterPreferenceSettings', () => {
  // Restore to default router preference before each unit test
  beforeEach(() => {
    store.dispatch(updateUserRouterPreference({ userRouterPreference: RouterPreference.API }))
  })
  it('toggles `Uniswap X` router preference', () => {
    render(<RouterPreferenceSettings />)

    const uniswapXToggle = screen.getByTestId('toggle-uniswap-x-button')

    fireEvent.click(uniswapXToggle)
    expect(uniswapXToggle).toHaveAttribute('aria-selected', 'true')
    expect(store.getState().user.userRouterPreference).toEqual(RouterPreference.X)

    fireEvent.click(uniswapXToggle)

    expect(uniswapXToggle).toHaveAttribute('aria-selected', 'false')
    expect(store.getState().user.userRouterPreference).toEqual(RouterPreference.API)
  })
  it('toggles `Local Routing` router preference', () => {
    render(<RouterPreferenceSettings />)

    const localRoutingToggle = screen.getByTestId('toggle-local-routing-button')

    fireEvent.click(localRoutingToggle)
    expect(localRoutingToggle).toHaveAttribute('aria-selected', 'true')
    expect(store.getState().user.userRouterPreference).toEqual(RouterPreference.CLIENT)

    fireEvent.click(localRoutingToggle)

    expect(localRoutingToggle).toHaveAttribute('aria-selected', 'false')
    expect(store.getState().user.userRouterPreference).toEqual(RouterPreference.API)
  })
})
