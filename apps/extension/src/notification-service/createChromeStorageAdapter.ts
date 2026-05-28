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
 * Parses and validates notification storage data from chrome.storage.local
 * @param functionName - Name of the calling function for error logging
 * @returns Validated storage data or empty object if parsing fails
 */
async function parseNotificationStorage(functionName: string): Promise<NotificationStorage> {
  try {
    const result = await chrome.storage.local.get(NOTIFICATION_STORAGE_KEY)
    const stored = result[NOTIFICATION_STORAGE_KEY]

    if (!stored) {
      return {}
    }

    const parsed = NotificationStorageSchema.safeParse(stored)
    if (!parsed.success) {
      getLogger().error(parsed.error, {
        tags: { file: 'createChromeStorageAdapter', function: functionName },
      })
      return {}
    }
    return parsed.data
  } catch (error) {
    getLogger().error(error, {
      tags: { file: 'createChromeStorageAdapter', function: functionName },
    })
    return {}
  }
}

/**
 * Creates a chrome.storage.local adapter that implements the storage interface
 * required by the API notification tracker.
 *
 * This adapter stores notification IDs with timestamps to enable:
 * - Offline tracking (when API calls fail)
 * - Deduplication (avoid sending duplicate ACKs)
 * - Cleanup of old entries
 */
export function createChromeStorageAdapter(): NonNullable<ApiNotificationTrackerContext['storage']> {
  return {
    has: async (notificationId: string): Promise<boolean> => {
      const processedIds = await parseNotificationStorage('has')
      return notificationId in processedIds
    },

    add: async (notificationId: string, metadata?: { timestamp: number }): Promise<void> => {
      const processedIds = await parseNotificationStorage('add')
      processedIds[notificationId] = { timestamp: metadata?.timestamp ?? Date.now() }
      await chrome.storage.local.set({ [NOTIFICATION_STORAGE_KEY]: processedIds })
    },

    getAll: async (): Promise<Set<string>> => {
      const processedIds = await parseNotificationStorage('getAll')
      return new Set(Object.keys(processedIds))
    },

    deleteOlderThan: async (timestamp: number): Promise<void> => {
      try {
        const processedIds = await parseNotificationStorage('deleteOlderThan')
        const filtered = Object.fromEntries(
          Object.entries(processedIds).filter(([, value]) => value.timestamp > timestamp),
        )
        await chrome.storage.local.set({ [NOTIFICATION_STORAGE_KEY]: filtered })
      } catch (error) {
        getLogger().error(error, {
          tags: { file: 'createChromeStorageAdapter', function: 'deleteOlderThan' },
        })
      }
    },
  }
}
