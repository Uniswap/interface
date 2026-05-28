import { ContentStyle } from '@universe/api'
import { createNotificationTelemetry } from '@universe/notifications/src/notification-telemetry/implementations/createNotificationTelemetry'
import { describe, expect, it, vi } from 'vitest'

describe('createNotificationTelemetry', () => {
  it('should format ContentStyle.MODAL to human-readable string', () => {
    const onNotificationReceived = vi.fn()
    const onNotificationShown = vi.fn()
    const onNotificationInteracted = vi.fn()

    const telemetry = createNotificationTelemetry({
      onNotificationReceived,
      onNotificationShown,
      onNotificationInteracted,
    })

    telemetry.onNotificationReceived({
      notificationId: 'test-id',
      type: ContentStyle.MODAL,
      source: 'backend',
      timestamp: 123456,
    })

    expect(onNotificationReceived).toHaveBeenCalledWith({
      notificationId: 'test-id',
      type: 'modal',
      source: 'backend',
      timestamp: 123456,
    })
  })

  it('should format ContentStyle.LOWER_LEFT_BANNER to human-readable string', () => {
    const onNotificationShown = vi.fn()

    const telemetry = createNotificationTelemetry({
      onNotificationReceived: vi.fn(),
      onNotificationShown,
      onNotificationInteracted: vi.fn(),
    })

    telemetry.onNotificationShown({
      notificationId: 'test-id',
      type: ContentStyle.LOWER_LEFT_BANNER,
      timestamp: 123456,
    })

    expect(onNotificationShown).toHaveBeenCalledWith({
      notificationId: 'test-id',
      type: 'lower_left_banner',
      timestamp: 123456,
    })
  })

  it('should format ContentStyle.UNSPECIFIED to human-readable string', () => {
    const onNotificationInteracted = vi.fn()

    const telemetry = createNotificationTelemetry({
      onNotificationReceived: vi.fn(),
      onNotificationShown: vi.fn(),
      onNotificationInteracted,
    })

    telemetry.onNotificationInteracted({
      notificationId: 'test-id',
      type: ContentStyle.UNSPECIFIED,
      action: 'dismiss',
    })

    expect(onNotificationInteracted).toHaveBeenCalledWith({
      notificationId: 'test-id',
      type: 'unspecified',
      action: 'dismiss',
    })
  })

  it('should format undefined type to "unknown"', () => {
    const onNotificationReceived = vi.fn()

    const telemetry = createNotificationTelemetry({
      onNotificationReceived,
      onNotificationShown: vi.fn(),
      onNotificationInteracted: vi.fn(),
    })

    telemetry.onNotificationReceived({
      notificationId: 'test-id',
      type: undefined,
      source: 'legacy',
      timestamp: 123456,
    })

    expect(onNotificationReceived).toHaveBeenCalledWith({
      notificationId: 'test-id',
      type: 'unknown',
      source: 'legacy',
      timestamp: 123456,
    })
  })
})
