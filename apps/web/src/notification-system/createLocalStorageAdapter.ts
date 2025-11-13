import type { ApiNotificationTrackerContext } from '@universe/notifications'
import { getLogger } from 'utilities/src/logger/logger'
import { z } from 'zod'

const NOTIFICATION_STORAGE_KEY = 'uniswap_notifications_processed'

const NotificationStorageSchema = z.record(
  z.string(),
  z.object({
    timestamp: z.number(),
  }),
)

type NotificationStorage = z.infer<typeof NotificationStorageSchema>

/**
 * Parses and validates notification storage data from localStorage
 * @param functionName - Name of the calling function for error logging
 * @returns Validated storage data or empty object if parsing fails
 */
function parseNotificationStorage(functionName: string): NotificationStorage {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
    if (!stored) {
      return {}
    }
    const parsed = JSON.parse(stored)
    const result = NotificationStorageSchema.safeParse(parsed)
    if (!result.success) {
      getLogger().error(result.error, {
        tags: { file: 'notification-system', function: functionName },
      })
      return {}
    }
    return result.data
  } catch (error) {
    getLogger().error(error, {
      tags: { file: 'notification-system', function: functionName },
    })
    return {}
  }
}

/**
 * Creates a localStorage adapter that implements the storage interface
 * required by the API notification tracker.
 *
 * This adapter stores notification IDs with timestamps to enable:
 * - Offline tracking (when API calls fail)
 * - Deduplication (avoid sending duplicate ACKs)
 * - Cleanup of old entries
 */
export function createLocalStorageAdapter(): NonNullable<ApiNotificationTrackerContext['storage']> {
  return {
    has: async (notificationId: string): Promise<boolean> => {
      const processedIds = parseNotificationStorage('isProcessed')
      return notificationId in processedIds
    },

    add: async (notificationId: string, metadata?: { timestamp: number }): Promise<void> => {
      try {
        const processedIds = parseNotificationStorage('track')
        processedIds[notificationId] = { timestamp: metadata?.timestamp ?? Date.now() }
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(processedIds))
      } catch (error) {
        getLogger().error(error, {
          tags: { file: 'notification-system', function: 'track' },
        })
      }
    },

    getAll: async (): Promise<Set<string>> => {
      const processedIds = parseNotificationStorage('getProcessedIds')
      return new Set(Object.keys(processedIds))
    },

    deleteOlderThan: async (timestamp: number): Promise<void> => {
      try {
        const processedIds = parseNotificationStorage('cleanup')
        const filtered = Object.fromEntries(
          Object.entries(processedIds).filter(([, value]) => value.timestamp > timestamp),
        )
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(filtered))
      } catch (error) {
        getLogger().error(error, {
          tags: { file: 'createLocalStorageAdapter', function: 'deleteOlderThan' },
        })
      }
    },
  }
}
