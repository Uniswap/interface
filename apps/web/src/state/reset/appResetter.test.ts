import 'utilities/src/logger/mocks'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { configureStore } from '@reduxjs/toolkit'
import { QueryClient } from '@tanstack/react-query'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setOpenModal } from '~/state/application/reducer'
import { addList } from '~/state/lists/actions'
import { createWebAppStateResetter } from '~/state/reset/appResetter'
import { type InterfaceState, interfaceReducer } from '~/state/webReducer'

// Mock the sagas module to prevent saga initialization during tests
vi.mock('~/state/sagas/root', () => ({
  monitoredSagaReducers: (state = {}, _action: any) => state,
  sagaTriggerActions: [],
  rootWebSaga: vi.fn(function* () {}),
}))

const createMockApolloClient = (): ApolloClient<unknown> => {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
  })
  vi.spyOn(client, 'resetStore').mockResolvedValue([])
  return client
}

const createMockQueryClient = (): QueryClient => {
  const client = new QueryClient()
  vi.spyOn(client, 'resetQueries').mockResolvedValue()
  return client
}

describe('createWebAppStateResetter', () => {
  let store: ReturnType<typeof configureStore<InterfaceState>>
  let apolloClient: ApolloClient<unknown>
  let queryClient: QueryClient
  let resetter: ReturnType<typeof createWebAppStateResetter>

  beforeEach(() => {
    store = configureStore({
      reducer: interfaceReducer,
    })
    apolloClient = createMockApolloClient()
    queryClient = createMockQueryClient()
    resetter = createWebAppStateResetter({
      dispatch: store.dispatch,
      apolloClient,
      queryClient,
    })
    vi.clearAllMocks()
  })

  describe('resetAccountHistory', () => {
    it('dispatches web-specific account history reset actions', async () => {
      // Modify web-specific state - open a modal
      store.dispatch(setOpenModal({ name: ModalName.Swap }))

      // Verify state was modified
      expect(store.getState().application.openModal?.name).toBe(ModalName.Swap)

      await resetter.resetAccountHistory()

      // Verify web-specific state was reset
      const state = store.getState()
      expect(state.application.openModal).toBeNull()
    })
  })

  describe('resetUserSettings', () => {
    it('dispatches web-specific user settings reset actions', async () => {
      // Modify web-specific state - change slippage and add a list
      store.dispatch(addList('https://test-token-list.com'))

      // Verify state was modified
      expect(store.getState().lists.byUrl['https://test-token-list.com']).toBeDefined()

      await resetter.resetUserSettings()

      // Verify web-specific state was reset
      const state = store.getState()
      expect(state.lists.byUrl['https://test-token-list.com']).toBeUndefined()
    })
  })

  describe('resetQueryCaches', () => {
    it('clears Apollo and React Query caches', async () => {
      await resetter.resetQueryCaches()

      // Verify cache clearing methods were called
      expect(apolloClient.resetStore).toHaveBeenCalledTimes(1)
      expect(queryClient.resetQueries).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetAll', () => {
    it('resets all state and clears all caches', async () => {
      // Modify state first
      store.dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: 'Test notification',
        }),
      )

      // Verify state was modified
      expect(store.getState().notifications.notificationQueue.length).toBe(1)

      await resetter.resetAll()

      // Verify all resets worked
      const state = store.getState()
      expect(state.notifications.notificationQueue).toEqual([])
      expect(apolloClient.resetStore).toHaveBeenCalledTimes(1)
      expect(queryClient.resetQueries).toHaveBeenCalledTimes(1)
    })
  })
})
