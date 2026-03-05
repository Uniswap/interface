import { type NetInfoState } from '@react-native-community/netinfo'
import { ContentStyle } from '@universe/api'
import { selectSomeModalOpen } from 'src/features/modals/selectSomeModalOpen'
import {
  createOfflineCondition,
  isOfflineBannerNotification,
  OFFLINE_BANNER_NOTIFICATION_ID,
} from 'src/notification-service/data-sources/reactive/offlineCondition'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

// Mock NetInfo
const mockAddEventListener = jest.fn()
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (callback: (state: NetInfoState) => void): (() => void) => mockAddEventListener(callback),
  useNetInfo: jest.fn(),
}))

// Mock selectors
jest.mock('src/features/modals/selectSomeModalOpen')
jest.mock('wallet/src/features/wallet/selectors')

const mockSelectSomeModalOpen = selectSomeModalOpen as jest.MockedFunction<typeof selectSomeModalOpen>
const mockSelectFinishedOnboarding = selectFinishedOnboarding as jest.MockedFunction<typeof selectFinishedOnboarding>

describe('offlineCondition', () => {
  const mockGetState = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAddEventListener.mockReturnValue(jest.fn()) // Return unsubscribe function
  })

  describe('createOfflineCondition', () => {
    it('returns a condition with the correct notification ID', () => {
      const condition = createOfflineCondition({ getState: mockGetState })

      expect(condition.notificationId).toBe(OFFLINE_BANNER_NOTIFICATION_ID)
      expect(condition.notificationId.startsWith('local:')).toBe(true)
    })

    describe('subscribe', () => {
      it('subscribes to NetInfo and returns unsubscribe function', () => {
        const mockUnsubscribe = jest.fn()
        mockAddEventListener.mockReturnValue(mockUnsubscribe)

        const condition = createOfflineCondition({ getState: mockGetState })
        const onStateChange = jest.fn()

        const unsubscribe = condition.subscribe(onStateChange)

        expect(mockAddEventListener).toHaveBeenCalledTimes(1)
        expect(unsubscribe).toBe(mockUnsubscribe)
      })

      it('calls onStateChange with combined state when network state changes', () => {
        mockSelectFinishedOnboarding.mockReturnValue(true)
        mockSelectSomeModalOpen.mockReturnValue(false)

        let capturedCallback: (state: NetInfoState) => void = jest.fn()
        // eslint-disable-next-line max-nested-callbacks
        mockAddEventListener.mockImplementation((callback: (state: NetInfoState) => void) => {
          capturedCallback = callback
          return jest.fn()
        })

        const condition = createOfflineCondition({ getState: mockGetState })
        const onStateChange = jest.fn()

        condition.subscribe(onStateChange)

        // Simulate network state change
        capturedCallback({ isConnected: false } as NetInfoState)

        expect(onStateChange).toHaveBeenCalledWith({
          isConnected: false,
          finishedOnboarding: true,
          isModalOpen: false,
        })
      })
    })

    describe('shouldShow', () => {
      it('returns true when offline, finished onboarding, and no modal open', () => {
        const condition = createOfflineCondition({ getState: mockGetState })

        expect(
          condition.shouldShow({
            isConnected: false,
            finishedOnboarding: true,
            isModalOpen: false,
          }),
        ).toBe(true)
      })

      it('returns false when connected', () => {
        const condition = createOfflineCondition({ getState: mockGetState })

        expect(
          condition.shouldShow({
            isConnected: true,
            finishedOnboarding: true,
            isModalOpen: false,
          }),
        ).toBe(false)
      })

      it('returns false when isConnected is null', () => {
        const condition = createOfflineCondition({ getState: mockGetState })

        expect(
          condition.shouldShow({
            isConnected: null,
            finishedOnboarding: true,
            isModalOpen: false,
          }),
        ).toBe(false)
      })

      it('returns false when not finished onboarding', () => {
        const condition = createOfflineCondition({ getState: mockGetState })

        expect(
          condition.shouldShow({
            isConnected: false,
            finishedOnboarding: false,
            isModalOpen: false,
          }),
        ).toBe(false)
      })

      it('returns false when modal is open', () => {
        const condition = createOfflineCondition({ getState: mockGetState })

        expect(
          condition.shouldShow({
            isConnected: false,
            finishedOnboarding: true,
            isModalOpen: true,
          }),
        ).toBe(false)
      })
    })

    describe('createNotification', () => {
      it('returns a notification with the correct ID and style', () => {
        const condition = createOfflineCondition({ getState: mockGetState })

        const notification = condition.createNotification({
          isConnected: false,
          finishedOnboarding: true,
          isModalOpen: false,
        })

        expect(notification.id).toBe(OFFLINE_BANNER_NOTIFICATION_ID)
        expect(notification.content?.style).toBe(ContentStyle.SYSTEM_BANNER)
      })
    })
  })

  describe('isOfflineBannerNotification', () => {
    it('returns true for offline banner notification', () => {
      const notification = { id: OFFLINE_BANNER_NOTIFICATION_ID } as any

      expect(isOfflineBannerNotification(notification)).toBe(true)
    })

    it('returns false for other notifications', () => {
      const notification = { id: 'some-other-notification' } as any

      expect(isOfflineBannerNotification(notification)).toBe(false)
    })

    it('returns false for other local notifications', () => {
      const notification = { id: 'local:other_trigger' } as any

      expect(isOfflineBannerNotification(notification)).toBe(false)
    })
  })
})
