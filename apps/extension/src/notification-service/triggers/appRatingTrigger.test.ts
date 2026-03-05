import {
  Content,
  Metadata,
  Notification,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { ContentStyle } from '@universe/api'
import {
  APP_RATING_NOTIFICATION_ID,
  createAppRatingTrigger,
  isAppRatingNotification,
} from 'src/notification-service/triggers/appRatingTrigger'
import { type ExtensionState } from 'src/store/extensionReducer'
import { appRatingStateSelector } from 'wallet/src/features/appRating/selectors'
import { setAppRating } from 'wallet/src/features/wallet/slice'

jest.mock('wallet/src/features/appRating/selectors')
const mockAppRatingStateSelector = appRatingStateSelector as jest.MockedFunction<typeof appRatingStateSelector>

describe('appRatingTrigger', () => {
  const mockDispatch = jest.fn()
  const mockGetState = jest.fn<ExtensionState, []>()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAppRatingTrigger', () => {
    it('returns a trigger with the correct ID', () => {
      const trigger = createAppRatingTrigger({
        getState: mockGetState,
        dispatch: mockDispatch,
      })

      expect(trigger.id).toBe(APP_RATING_NOTIFICATION_ID)
      expect(trigger.id.startsWith('local:')).toBe(true)
    })

    describe('shouldShow', () => {
      it('returns true when appRatingStateSelector.shouldPrompt is true', () => {
        mockAppRatingStateSelector.mockReturnValue({
          shouldPrompt: true,
          consecutiveSwapsCondition: true,
          appRatingPromptedMs: undefined,
          appRatingProvidedMs: undefined,
        })

        const trigger = createAppRatingTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
        })

        expect(trigger.shouldShow()).toBe(true)
        expect(mockAppRatingStateSelector).toHaveBeenCalledWith(mockGetState())
      })

      it('returns false when appRatingStateSelector.shouldPrompt is false', () => {
        mockAppRatingStateSelector.mockReturnValue({
          shouldPrompt: false,
          consecutiveSwapsCondition: false,
          appRatingPromptedMs: Date.now(),
          appRatingProvidedMs: undefined,
        })

        const trigger = createAppRatingTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
        })

        expect(trigger.shouldShow()).toBe(false)
      })
    })

    describe('createNotification', () => {
      it('returns a notification with the correct ID and style', () => {
        const trigger = createAppRatingTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
        })

        const notification = trigger.createNotification()

        expect(notification.id).toBe(APP_RATING_NOTIFICATION_ID)
        expect(notification.content?.style).toBe(ContentStyle.MODAL)
      })

      it('returns a notification with local metadata', () => {
        const trigger = createAppRatingTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
        })

        const notification = trigger.createNotification()

        expect(notification.metadata?.owner).toBe('local')
        expect(notification.metadata?.business).toBe('app_rating')
      })
    })

    describe('onAcknowledge', () => {
      it('dispatches setAppRating when called', () => {
        const trigger = createAppRatingTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
        })

        trigger.onAcknowledge?.()

        expect(mockDispatch).toHaveBeenCalledWith(setAppRating({}))
      })
    })
  })

  describe('isAppRatingNotification', () => {
    it('returns true for app rating notification', () => {
      const notification = new Notification({
        id: APP_RATING_NOTIFICATION_ID,
        content: new Content({ style: ContentStyle.MODAL, title: '' }),
        metadata: new Metadata({ owner: 'local', business: 'app_rating' }),
      })

      expect(isAppRatingNotification(notification)).toBe(true)
    })

    it('returns false for other notifications', () => {
      const notification = new Notification({
        id: 'some-other-notification',
        content: new Content({ style: ContentStyle.MODAL, title: '' }),
        metadata: new Metadata({ owner: 'test', business: 'test' }),
      })

      expect(isAppRatingNotification(notification)).toBe(false)
    })

    it('returns false for other local notifications', () => {
      const notification = new Notification({
        id: 'local:other_trigger',
        content: new Content({ style: ContentStyle.MODAL, title: '' }),
        metadata: new Metadata({ owner: 'local', business: 'other' }),
      })

      expect(isAppRatingNotification(notification)).toBe(false)
    })
  })
})
