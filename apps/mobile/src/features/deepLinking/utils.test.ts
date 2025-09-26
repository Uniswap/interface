import { CommonActions } from '@react-navigation/core'
import { call, put } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { dismissAllModalsBeforeNavigation } from 'src/features/deepLinking/utils'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

// Mock the navigation ref
jest.mock('src/app/navigation/navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(),
    dispatch: jest.fn(),
    getState: jest.fn(),
    canGoBack: jest.fn(),
  },
}))

const mockNavigationRef = navigationRef as jest.Mocked<typeof navigationRef>

describe('dismissAllModalsBeforeNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should close all Redux-managed modals and dismiss React Navigation modals when navigationRef is ready', () => {
    mockNavigationRef.isReady.mockReturnValue(true)
    mockNavigationRef.getState.mockReturnValue({
      key: 'root',
      index: 2,
      routeNames: [MobileScreens.Home, 'ModalName.Swap', 'ModalName.Explore'],
      type: 'stack',
      stale: false,
      routes: [
        { name: MobileScreens.Home, key: 'home', params: undefined },
        { name: 'ModalName.Swap', key: 'swap', params: undefined },
        { name: 'ModalName.Explore', key: 'explore', params: undefined },
      ],
    })
    mockNavigationRef.canGoBack.mockReturnValue(true)

    const expectedGoBackAction = CommonActions.goBack()

    return expectSaga(dismissAllModalsBeforeNavigation)
      .provide([
        [put(closeAllModals()), undefined],
        [call(dispatchNavigationAction, expectedGoBackAction), undefined],
      ])
      .put(closeAllModals())
      .call(dispatchNavigationAction, expectedGoBackAction)
      .call(dispatchNavigationAction, expectedGoBackAction)
      .silentRun()
  })

  it('should close all Redux-managed modals but skip navigation actions when navigationRef is not ready', () => {
    mockNavigationRef.isReady.mockReturnValue(false)

    return expectSaga(dismissAllModalsBeforeNavigation)
      .provide([[put(closeAllModals()), undefined]])
      .put(closeAllModals())
      .not.call.fn(dispatchNavigationAction)
      .silentRun()
  })

  it('should not dispatch navigation actions when already on home screen', () => {
    mockNavigationRef.isReady.mockReturnValue(true)
    mockNavigationRef.getState.mockReturnValue({
      key: 'root',
      index: 0,
      routeNames: [MobileScreens.Home],
      type: 'stack',
      stale: false,
      routes: [{ name: MobileScreens.Home, key: 'home', params: undefined }],
    })

    return expectSaga(dismissAllModalsBeforeNavigation)
      .provide([[put(closeAllModals()), undefined]])
      .put(closeAllModals())
      .not.call.fn(dispatchNavigationAction)
      .silentRun()
  })

  it('should handle navigation state with empty routes array', () => {
    mockNavigationRef.isReady.mockReturnValue(true)
    mockNavigationRef.getState.mockReturnValue({
      key: 'root',
      index: 0,
      routeNames: [],
      type: 'stack',
      stale: false,
      routes: [],
    })

    return expectSaga(dismissAllModalsBeforeNavigation)
      .provide([[put(closeAllModals()), undefined]])
      .put(closeAllModals())
      .not.call.fn(dispatchNavigationAction)
      .silentRun()
  })

  it('should handle case when home screen is not found in navigation stack', () => {
    mockNavigationRef.isReady.mockReturnValue(true)
    mockNavigationRef.getState.mockReturnValue({
      key: 'root',
      index: 1,
      routeNames: ['ModalName.Swap', 'ModalName.Explore'],
      type: 'stack',
      stale: false,
      routes: [
        { name: 'ModalName.Swap', key: 'swap', params: undefined },
        { name: 'ModalName.Explore', key: 'explore', params: undefined },
      ],
    })

    return expectSaga(dismissAllModalsBeforeNavigation)
      .provide([[put(closeAllModals()), undefined]])
      .put(closeAllModals())
      .not.call.fn(dispatchNavigationAction)
      .silentRun()
  })

  it('should stop going back when canGoBack returns false', () => {
    mockNavigationRef.isReady.mockReturnValue(true)
    mockNavigationRef.getState.mockReturnValue({
      key: 'root',
      index: 2,
      routeNames: [MobileScreens.Home, 'ModalName.Swap', 'ModalName.Explore'],
      type: 'stack',
      stale: false,
      routes: [
        { name: MobileScreens.Home, key: 'home', params: undefined },
        { name: 'ModalName.Swap', key: 'swap', params: undefined },
        { name: 'ModalName.Explore', key: 'explore', params: undefined },
      ],
    })
    mockNavigationRef.canGoBack
      .mockReturnValueOnce(true) // First goBack succeeds
      .mockReturnValueOnce(false) // Second goBack fails

    const expectedGoBackAction = CommonActions.goBack()

    return expectSaga(dismissAllModalsBeforeNavigation)
      .provide([
        [put(closeAllModals()), undefined],
        [call(dispatchNavigationAction, expectedGoBackAction), undefined],
      ])
      .put(closeAllModals())
      .call(dispatchNavigationAction, expectedGoBackAction)
      .silentRun()
  })
})
