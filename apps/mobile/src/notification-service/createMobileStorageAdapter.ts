import type { ApiNotificationTrackerContext } from '@universe/notifications'
import { MMKV } from 'react-native-mmkv'
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

// Create a dedicated MMKV instance for notifications
// This keeps notification data separate from Redux persist storage
const notificationStorage = new MMKV({ id: 'notifications' })

/**
 * Parses and validates notification storage data from MMKV
 * @param functionName - Name of the calling function for error logging
 * @returns Validated storage data or empty object if parsing fails
 */
function parseNotificationStorage(functionName: string): NotificationStorage {
  try {
    const stored = notificationStorage.getString(NOTIFICATION_STORAGE_KEY)

    if (!stored) {
      return {}
    }

    const parsed = NotificationStorageSchema.safeParse(JSON.parse(stored))
    if (!parsed.success) {
      getLogger().error(parsed.error, {
        tags: { file: 'createMobileStorageAdapter', function: functionName },
      })
      return {}
    }
    return parsed.data
  } catch (error) {
    getLogger().error(error, {
      tags: { file: 'createMobileStorageAdapter', function: functionName },
    })
    return {}
  }
}

/**
 * Saves notification storage data to MMKV
 * @param data - The data to save
 * @param functionName - Name of the calling function for error logging
 */
function saveNotificationStorage(data: NotificationStorage, functionName: string): void {
  try {
    notificationStorage.set(NOTIFICATION_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    getLogger().error(error, {
      tags: { file: 'createMobileStorageAdapter', function: functionName },
    })
  }
}

/**
 * Creates an MMKV storage adapter that implements the storage interface
 * required by the API notification tracker.
 *
 * This adapter stores notification IDs with timestamps to enable:
 * - Offline tracking (when API calls fail)
 * - Deduplication (avoid sending duplicate ACKs)
 * - Cleanup of old entries
 */
export function createMobileStorageAdapter(): NonNullable<ApiNotificationTrackerContext['storage']> {
  return {
    has: async (notificationId: string): Promise<boolean> => {
      const processedIds = parseNotificationStorage('has')
      return notificationId in processedIds
    },

    add: async (notificationId: string, metadata?: { timestamp: number }): Promise<void> => {
      const processedIds = parseNotificationStorage('add')
      processedIds[notificationId] = { timestamp: metadata?.timestamp ?? Date.now() }
      saveNotificationStorage(processedIds, 'add')
    },

    getAll: async (): Promise<Set<string>> => {
      const processedIds = parseNotificationStorage('getAll')
      return new Set(Object.keys(processedIds))
    },

    deleteOlderThan: async (timestamp: number): Promise<void> => {
      const processedIds = parseNotificationStorage('deleteOlderThan')
      const filtered = Object.fromEntries(
        Object.entries(processedIds).filter(([, value]) => value.timestamp > timestamp),
      )
      saveNotificationStorage(filtered, 'deleteOlderThan')
    },
  }
}
