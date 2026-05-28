import type { Page } from '~/playwright/fixtures'

interface UserStateOverrides {
  originCountry?: string
}

/**
 * Sets up Redux persisted user state before page navigation.
 *
 * Use this to pre-configure user state that would normally be set at runtime
 * but isn't available in the Playwright test environment.
 *
 * All required UserState fields must be provided or the app crashes during
 * redux-persist hydration. This helper provides sensible defaults matching
 * the reducer's initialState, allowing tests to only specify overrides.
 *
 * @example
 * ```typescript
 * test('test with custom user state', async ({ page }) => {
 *   await setPersistedUserState(page, { originCountry: 'GB' })
 *   await page.goto('/swap')
 *   // ...
 * })
 * ```
 */
export async function setPersistedUserState(page: Page, overrides: UserStateOverrides): Promise<void> {
  await page.addInitScript((state) => {
    const persistedState = {
      user: {
        // Required fields with defaults matching initialState from reducer
        userRouterPreference: 'uniswapx',
        userHideClosedPositions: false,
        userSlippageTolerance: 'auto',
        userSlippageToleranceHasBeenMigratedToAuto: true,
        userDeadline: 600,
        pairs: {},
        timestamp: Date.now(),
        // Apply overrides (e.g., originCountry: 'GB')
        ...state,
      },
      _persist: { version: 61, rehydrated: true },
    }
    localStorage.setItem('redux/persist:interface', JSON.stringify(persistedState))
  }, overrides)
}
