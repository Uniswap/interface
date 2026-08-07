import { combineReducers, configureStore, type Store } from '@reduxjs/toolkit'
import { act, render, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { type PersistConfig, persistReducer, persistStore } from 'redux-persist'
import { ReactRouterUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { Language } from 'uniswap/src/features/language/constants'
import {
  initialUserSettingsState,
  userSettingsReducer,
  type UserSettingsState,
} from 'uniswap/src/features/settings/slice'
import { LanguageProvider } from '~/i18n/LanguageProvider'

interface HarnessState {
  userSettings: UserSettingsState
}

interface Harness {
  store: Store
  /** Resolves the pending storage read, completing `persist/REHYDRATE` with the given slice. */
  rehydrateWith: (userSettings: UserSettingsState) => void
}

/**
 * Builds a store whose rehydration stays pending until the test resolves it, mirroring the
 * production setup where `persist/REHYDRATE` arrives asynchronously after first render.
 * Uses the real `persistReducer` (with the app's unserialized-storage config) so the test
 * exercises redux-persist's actual state reconciliation.
 */
function createHarness(): Harness {
  let resolveStored!: (state: unknown) => void
  const stored = new Promise((resolve) => {
    resolveStored = resolve
  })
  const storage = {
    getItem: (): Promise<unknown> => stored,
    setItem: (): Promise<void> => Promise.resolve(),
    removeItem: (): Promise<void> => Promise.resolve(),
  }
  const persistConfig = {
    key: 'test',
    version: 1,
    storage,
    whitelist: ['userSettings'],
    serialize: false,
    deserialize: false,
    // SAFETY: `deserialize` is missing from redux-persist's types but is required for
    // unserialized storage, matching the app's persist config in apps/web/src/state/index.ts
  } as unknown as PersistConfig<HarnessState>
  const reducer = persistReducer(persistConfig, combineReducers({ userSettings: userSettingsReducer }))
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  })
  persistStore(store)
  return {
    store,
    rehydrateWith: (userSettings) => resolveStored({ userSettings }),
  }
}

let navigateTo: (to: string) => void
function CaptureNavigate(): null {
  navigateTo = useNavigate()
  return null
}

function renderWithLngParam(store: Store): void {
  render(
    <Provider store={store}>
      <ReactRouterUrlProvider>
        <MemoryRouter initialEntries={['/swap?lng=fr-FR']}>
          <LanguageProvider>
            <CaptureNavigate />
            <Routes>
              <Route path="/swap" element={null} />
              <Route path="/explore" element={null} />
            </Routes>
          </LanguageProvider>
        </MemoryRouter>
      </ReactRouterUrlProvider>
    </Provider>,
  )
}

const getCurrentLanguage = (store: Store): Language => (store.getState() as HarnessState).userSettings.currentLanguage

describe('LanguageProvider', () => {
  it('persists the lng query param language across rehydration and navigation without the param', async () => {
    const { store, rehydrateWith } = createHarness()
    renderWithLngParam(store)

    // the URL locale is stored before rehydration completes
    await waitFor(() => expect(getCurrentLanguage(store)).toBe(Language.French))

    // rehydration delivers a previously-persisted language, replacing the userSettings slice
    act(() => rehydrateWith({ ...initialUserSettingsState, currentLanguage: Language.English }))
    await waitFor(() =>
      expect((store.getState() as { _persist: { rehydrated: boolean } })._persist.rehydrated).toBe(true),
    )

    // the URL locale must be re-stored after rehydration...
    await waitFor(() => expect(getCurrentLanguage(store)).toBe(Language.French))

    // ...so navigating to a page without the param keeps the language
    act(() => navigateTo('/explore'))
    await waitFor(() => expect(document.documentElement.getAttribute('lang')).toBe('fr-FR'))
    expect(getCurrentLanguage(store)).toBe(Language.French)
  })
})
