import { ApolloClient, InMemoryCache } from '@apollo/client'
import { configureStore } from '@reduxjs/toolkit'
import { QueryClient } from '@tanstack/react-query'
import { dappRequestActions } from 'src/app/features/dappRequests/slice'
import { createExtensionAppStateResetter } from 'src/store/appStateResetter'
import { type ExtensionState, extensionReducer } from 'src/store/extensionReducer'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'

const createMockApolloClient = (): ApolloClient<unknown> => {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
  })
  jest.spyOn(client, 'resetStore').mockResolvedValue([])
  return client
}

const createMockQueryClient = (): QueryClient => {
  const client = new QueryClient()
  jest.spyOn(client, 'resetQueries').mockResolvedValue()
  return client
}

describe('createExtensionAppStateResetter', () => {
  let store: ReturnType<typeof configureStore<ExtensionState>>
  let apolloClient: ApolloClient<unknown>
  let queryClient: QueryClient
  let resetter: ReturnType<typeof createExtensionAppStateResetter>

  beforeEach(() => {
    store = configureStore({
      reducer: extensionReducer,
    })
    apolloClient = createMockApolloClient()
    queryClient = createMockQueryClient()
    resetter = createExtensionAppStateResetter({
      dispatch: store.dispatch,
      apolloClient,
      queryClient,
    })
    jest.clearAllMocks()
  })

  describe('resetAccountHistory', () => {
    it('dispatches extension-specific account history reset actions', async () => {
      // Modify extension-specific state - add a dapp request
      store.dispatch(
        dappRequestActions.add({
          dappRequest: {
            type: DappRequestType.SignMessage,
            requestId: 'test-request-1',
            messageHex: '0x123',
            address: '0x123',
          },
          senderTabInfo: { id: 1, url: 'https://test.com' },
          isSidebarClosed: false,
        }),
      )

      // Verify state was modified
      expect(Object.keys(store.getState().dappRequests.requests).length).toBe(1)

      await resetter.resetAccountHistory()

      // Verify extension-specific state was reset
      const state = store.getState()
      expect(Object.keys(state.dappRequests.requests).length).toBe(0)
    })
  })

  describe('resetUserSettings', () => {
    it('completes without errors', async () => {
      // Extension has no additional user settings to reset beyond base
      await expect(resetter.resetUserSettings()).resolves.not.toThrow()
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
