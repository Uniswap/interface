import { createLocalTriggerDataSource } from '@universe/notifications/src/notification-data-source/implementations/createLocalTriggerDataSource'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { type MobileState } from 'src/app/mobileReducer'
import { createBackupReminderTrigger } from 'src/notification-service/triggers/backupReminderTrigger'
import {
  createMobileLocalTriggerDataSource,
  isLocalTriggerNotification,
} from 'src/notification-service/triggers/createMobileLocalTriggerDataSource'

jest.mock('@universe/notifications/src/notification-data-source/implementations/createLocalTriggerDataSource')
jest.mock('src/notification-service/triggers/backupReminderTrigger')

const mockCreateLocalTriggerDataSource = createLocalTriggerDataSource as jest.MockedFunction<
  typeof createLocalTriggerDataSource
>
const mockCreateBackupReminderTrigger = createBackupReminderTrigger as jest.MockedFunction<
  typeof createBackupReminderTrigger
>

describe('createMobileLocalTriggerDataSource', () => {
  const mockDispatch = jest.fn()
  const mockGetState = jest.fn<MobileState, []>()
  const mockGetPortfolioValue = jest.fn<Promise<number>, []>()
  const mockTracker = {
    isProcessed: jest.fn(),
    markProcessed: jest.fn(),
    markNotProcessed: jest.fn(),
  } as unknown as NotificationTracker

  const mockBackupReminderTrigger = {
    id: 'local:backup_reminder_modal',
    shouldShow: jest.fn().mockResolvedValue(true),
    createNotification: jest.fn(),
    onAcknowledge: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateBackupReminderTrigger.mockReturnValue(mockBackupReminderTrigger)
    mockCreateLocalTriggerDataSource.mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    })
  })

  describe('createMobileLocalTriggerDataSource', () => {
    it('creates a data source with backup reminder trigger', () => {
      createMobileLocalTriggerDataSource({
        getState: mockGetState,
        dispatch: mockDispatch,
        tracker: mockTracker,
        getPortfolioValue: mockGetPortfolioValue,
      })

      expect(mockCreateBackupReminderTrigger).toHaveBeenCalledWith({
        getState: mockGetState,
        dispatch: mockDispatch,
        getPortfolioValue: mockGetPortfolioValue,
      })
    })

    it('passes triggers to createLocalTriggerDataSource', () => {
      createMobileLocalTriggerDataSource({
        getState: mockGetState,
        dispatch: mockDispatch,
        tracker: mockTracker,
        getPortfolioValue: mockGetPortfolioValue,
      })

      expect(mockCreateLocalTriggerDataSource).toHaveBeenCalledWith({
        triggers: [mockBackupReminderTrigger],
        tracker: mockTracker,
        pollIntervalMs: 5000, // default
        source: 'mobile_local_triggers',
        logFileTag: 'createMobileLocalTriggerDataSource',
      })
    })

    it('uses custom poll interval when provided', () => {
      createMobileLocalTriggerDataSource({
        getState: mockGetState,
        dispatch: mockDispatch,
        tracker: mockTracker,
        getPortfolioValue: mockGetPortfolioValue,
        pollIntervalMs: 10000,
      })

      expect(mockCreateLocalTriggerDataSource).toHaveBeenCalledWith(
        expect.objectContaining({
          pollIntervalMs: 10000,
        }),
      )
    })

    it('returns the data source from createLocalTriggerDataSource', () => {
      const mockDataSource = {
        start: jest.fn(),
        stop: jest.fn(),
      }
      mockCreateLocalTriggerDataSource.mockReturnValue(mockDataSource)

      const result = createMobileLocalTriggerDataSource({
        getState: mockGetState,
        dispatch: mockDispatch,
        tracker: mockTracker,
        getPortfolioValue: mockGetPortfolioValue,
      })

      expect(result).toBe(mockDataSource)
    })
  })

  describe('isLocalTriggerNotification', () => {
    it('returns true for notifications with local: prefix', () => {
      expect(isLocalTriggerNotification('local:backup_reminder_modal')).toBe(true)
      expect(isLocalTriggerNotification('local:app_rating')).toBe(true)
      expect(isLocalTriggerNotification('local:some_other_trigger')).toBe(true)
    })

    it('returns false for notifications without local: prefix', () => {
      expect(isLocalTriggerNotification('backup_reminder_modal')).toBe(false)
      expect(isLocalTriggerNotification('some-notification-id')).toBe(false)
      expect(isLocalTriggerNotification('uuid-1234-5678')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isLocalTriggerNotification('')).toBe(false)
    })

    it('is case-sensitive for prefix', () => {
      expect(isLocalTriggerNotification('LOCAL:backup_reminder')).toBe(false)
      expect(isLocalTriggerNotification('Local:backup_reminder')).toBe(false)
    })
  })
})
