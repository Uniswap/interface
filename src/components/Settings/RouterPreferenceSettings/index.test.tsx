import store from 'state'
import { RouterPreference } from 'state/routing/types'
import { updateUserRouterPreference } from 'state/user/reducer'
import { fireEvent, render, screen } from 'test-utils/render'

import RouterPreferenceSettings from '.'

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
})
