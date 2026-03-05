import {
  Content,
  Metadata,
  Notification,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import type { InAppNotification } from '@universe/api'
import { ContentStyle } from '@universe/api'
import {
  createLocalTriggerDataSource,
  getTriggerById,
  type TriggerCondition,
} from '@universe/notifications/src/notification-data-source/implementations/createLocalTriggerDataSource'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createMockNotification(id: string): InAppNotification {
  return new Notification({
    id,
    metadata: new Metadata({ owner: 'test', business: 'test' }),
    content: new Content({ style: ContentStyle.MODAL, title: 'Test Notification' }),
  })
}

function createMockTracker(processedIds: Set<string> = new Set()): NotificationTracker {
  return {
    isProcessed: vi.fn().mockImplementation((id: string) => Promise.resolve(processedIds.has(id))),
    getProcessedIds: vi.fn().mockResolvedValue(processedIds),
    track: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
  }
}

describe('createLocalTriggerDataSource', () => {
  let mockTracker: NotificationTracker

  beforeEach(() => {
    vi.useFakeTimers()
    mockTracker = createMockTracker()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('creates a notification data source with start and stop methods', () => {
    const dataSource = createLocalTriggerDataSource({
      triggers: [],
      tracker: mockTracker,
    })

    expect(dataSource).toBeDefined()
    expect(typeof dataSource.start).toBe('function')
    expect(typeof dataSource.stop).toBe('function')
  })

  it('checks triggers immediately on start', async () => {
    const mockNotification = createMockNotification('local:test')
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn().mockReturnValue(mockNotification),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Allow the initial async poll to complete
    await vi.advanceTimersByTimeAsync(0)

    expect(trigger.shouldShow).toHaveBeenCalled()
    expect(onNotifications).toHaveBeenCalledWith([mockNotification], 'local_triggers')

    await dataSource.stop()
  })

  it('polls triggers at the specified interval', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
      pollIntervalMs: 1000,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Initial check (immediate poll on start)
    await vi.advanceTimersByTimeAsync(0)
    expect(trigger.shouldShow).toHaveBeenCalledTimes(1)

    // Advance by poll interval
    await vi.advanceTimersByTimeAsync(1000)
    expect(trigger.shouldShow).toHaveBeenCalledTimes(2)

    // Advance again
    await vi.advanceTimersByTimeAsync(1000)
    expect(trigger.shouldShow).toHaveBeenCalledTimes(3)

    await dataSource.stop()
  })

  it('skips triggers that are already processed', async () => {
    const processedTracker = createMockTracker(new Set(['local:processed']))

    const processedTrigger: TriggerCondition = {
      id: 'local:processed',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn(),
    }

    const unprocessedTrigger: TriggerCondition = {
      id: 'local:unprocessed',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn().mockReturnValue(createMockNotification('local:unprocessed')),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [processedTrigger, unprocessedTrigger],
      tracker: processedTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    // Processed trigger should not have shouldShow called
    expect(processedTrigger.shouldShow).not.toHaveBeenCalled()
    // Unprocessed trigger should be evaluated
    expect(unprocessedTrigger.shouldShow).toHaveBeenCalled()
    expect(unprocessedTrigger.createNotification).toHaveBeenCalled()

    await dataSource.stop()
  })

  it('does not create notification when shouldShow returns false', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    expect(trigger.shouldShow).toHaveBeenCalled()
    expect(trigger.createNotification).not.toHaveBeenCalled()
    expect(onNotifications).toHaveBeenCalledWith([], 'local_triggers')

    await dataSource.stop()
  })

  it('handles async shouldShow functions', async () => {
    const mockNotification = createMockNotification('local:async')
    const trigger: TriggerCondition = {
      id: 'local:async',
      shouldShow: vi.fn().mockResolvedValue(true),
      createNotification: vi.fn().mockReturnValue(mockNotification),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    expect(trigger.shouldShow).toHaveBeenCalled()
    expect(onNotifications).toHaveBeenCalledWith([mockNotification], 'local_triggers')

    await dataSource.stop()
  })

  it('handles multiple triggers', async () => {
    const notification1 = createMockNotification('local:trigger1')
    const notification2 = createMockNotification('local:trigger2')

    const trigger1: TriggerCondition = {
      id: 'local:trigger1',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn().mockReturnValue(notification1),
    }

    const trigger2: TriggerCondition = {
      id: 'local:trigger2',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn().mockReturnValue(notification2),
    }

    const trigger3: TriggerCondition = {
      id: 'local:trigger3',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger1, trigger2, trigger3],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    expect(onNotifications).toHaveBeenCalledWith([notification1, notification2], 'local_triggers')

    await dataSource.stop()
  })

  it('handles errors in individual triggers gracefully', async () => {
    const goodNotification = createMockNotification('local:good')

    const errorTrigger: TriggerCondition = {
      id: 'local:error',
      shouldShow: vi.fn().mockImplementation(() => {
        throw new Error('Trigger error')
      }),
      createNotification: vi.fn(),
    }

    const goodTrigger: TriggerCondition = {
      id: 'local:good',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn().mockReturnValue(goodNotification),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [errorTrigger, goodTrigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    // Should still emit good notification despite error in first trigger
    expect(onNotifications).toHaveBeenCalledWith([goodNotification], 'local_triggers')

    await dataSource.stop()
  })

  it('handles errors in tracker.isProcessed gracefully', async () => {
    const errorTracker = createMockTracker()
    errorTracker.isProcessed = vi.fn().mockRejectedValue(new Error('Tracker error'))

    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: errorTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    // Should emit empty array on error
    expect(onNotifications).toHaveBeenCalledWith([], 'local_triggers')

    await dataSource.stop()
  })

  it('does not start twice if already active', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Try to start again
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    // Should only call shouldShow once from the initial start
    expect(trigger.shouldShow).toHaveBeenCalledTimes(1)

    await dataSource.stop()
  })

  it('stops polling when stop is called', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
      pollIntervalMs: 100,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)
    const callCountBeforeStop = (trigger.shouldShow as ReturnType<typeof vi.fn>).mock.calls.length

    await dataSource.stop()

    // Advance timers after stop
    await vi.advanceTimersByTimeAsync(500)

    // Should not have additional calls
    expect(trigger.shouldShow).toHaveBeenCalledTimes(callCountBeforeStop)
  })

  it('can be started again after stopping', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()

    // Start, check, stop
    dataSource.start(onNotifications)
    await vi.advanceTimersByTimeAsync(0)
    await dataSource.stop()

    vi.clearAllMocks()

    // Start again
    dataSource.start(onNotifications)
    await vi.advanceTimersByTimeAsync(0)

    expect(trigger.shouldShow).toHaveBeenCalled()

    await dataSource.stop()
  })

  it('uses custom source name', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
      source: 'custom_source',
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.advanceTimersByTimeAsync(0)

    expect(onNotifications).toHaveBeenCalledWith([], 'custom_source')

    await dataSource.stop()
  })

  it('uses default poll interval of 5000ms', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(false),
      createNotification: vi.fn(),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Initial check
    await vi.advanceTimersByTimeAsync(0)
    expect(trigger.shouldShow).toHaveBeenCalledTimes(1)

    // Advance less than default interval
    await vi.advanceTimersByTimeAsync(4000)
    expect(trigger.shouldShow).toHaveBeenCalledTimes(1)

    // Advance to complete the default interval
    await vi.advanceTimersByTimeAsync(1000)
    expect(trigger.shouldShow).toHaveBeenCalledTimes(2)

    await dataSource.stop()
  })

  it('does not call onNotifications after stop even if polling was in progress', async () => {
    const trigger: TriggerCondition = {
      id: 'local:test',
      shouldShow: vi.fn().mockReturnValue(true),
      createNotification: vi.fn().mockReturnValue(createMockNotification('local:test')),
    }

    const dataSource = createLocalTriggerDataSource({
      triggers: [trigger],
      tracker: mockTracker,
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Stop immediately before any async operations complete
    await dataSource.stop()

    // Clear any pending timers
    await vi.runAllTimersAsync()

    // The callback should not be set after stop, so no additional calls
    // (Initial call may or may not have happened depending on timing)
    const callCount = onNotifications.mock.calls.length
    await vi.advanceTimersByTimeAsync(10000)
    expect(onNotifications).toHaveBeenCalledTimes(callCount)
  })
})

describe('getTriggerById', () => {
  it('returns the trigger with matching ID', () => {
    const trigger1: TriggerCondition = {
      id: 'local:trigger1',
      shouldShow: () => true,
      createNotification: () => createMockNotification('local:trigger1'),
    }

    const trigger2: TriggerCondition = {
      id: 'local:trigger2',
      shouldShow: () => false,
      createNotification: () => createMockNotification('local:trigger2'),
    }

    const triggers = [trigger1, trigger2]

    expect(getTriggerById(triggers, 'local:trigger1')).toBe(trigger1)
    expect(getTriggerById(triggers, 'local:trigger2')).toBe(trigger2)
  })

  it('returns undefined when no trigger matches', () => {
    const triggers: TriggerCondition[] = [
      {
        id: 'local:trigger1',
        shouldShow: () => true,
        createNotification: () => createMockNotification('local:trigger1'),
      },
    ]

    expect(getTriggerById(triggers, 'local:nonexistent')).toBeUndefined()
  })

  it('returns undefined for empty triggers array', () => {
    expect(getTriggerById([], 'local:any')).toBeUndefined()
  })
})
