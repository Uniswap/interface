import {
  Background,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction, SharedQueryClient } from '@universe/api'
import {
  createNotificationDataSource,
  type NotificationDataSource,
  type NotificationTracker,
} from '@universe/notifications'
import { AppRoutes, SettingsRoutes, UnitagClaimRoutes } from 'src/app/navigation/constants'
import { getReduxStore } from 'src/store/store'

import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'uniswap/src/features/unitags/constants'
import i18n from 'uniswap/src/i18n'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { selectHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/selectors'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'

// Using 'local:' prefix to indicate these are client-only notifications
// This prevents the API tracker from sending AckNotification calls to the backend
const RECOVERY_BACKUP_BANNER_ID = 'local:recovery_backup_banner'
const UNITAG_CLAIM_BANNER_ID = 'local:unitag_claim_banner'

interface CreateExtensionLegacyBannersNotificationDataSourceContext {
  tracker: NotificationTracker
  pollIntervalMs?: number
}

/**
 * Creates a notification data source that converts HomeIntroCardStack cards
 * into InAppNotifications compatible with the notification system.
 *
 * This replaces the legacy HomeIntroCardStack with notification system equivalents:
 * - Recovery backup reminder
 * - Unitag claim prompt
 *
 * **Migration Logic:**
 * This data source checks for legacy dismissal state in Redux and automatically
 * migrates it to the notification system on first run.
 */
export function createExtensionLegacyBannersNotificationDataSource(
  ctx: CreateExtensionLegacyBannersNotificationDataSourceContext,
): NotificationDataSource {
  const { tracker, pollIntervalMs = 5000 } = ctx

  let intervalId: NodeJS.Timeout | null = null
  let currentCallback: ((notifications: InAppNotification[], source: string) => void) | null = null
  let hasMigratedLegacyState = false

  /**
   * Migrates legacy dismissal state from Redux to the notification system.
   * This runs once on the first poll to ensure users who dismissed cards in the old system
   * don't see them again.
   */
  const migrateLegacyDismissalState = async (): Promise<void> => {
    if (hasMigratedLegacyState) {
      return
    }

    try {
      const state = getReduxStore().getState()

      // Migrate Unitag skip state
      const hasSkippedUnitag = selectHasSkippedUnitagPrompt(state)
      if (hasSkippedUnitag) {
        logger.info(
          'createExtensionLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating Unitag skip from legacy Redux state',
        )
        await tracker.track(UNITAG_CLAIM_BANNER_ID, { timestamp: Date.now() })
      }

      hasMigratedLegacyState = true
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'createExtensionLegacyBannersNotificationDataSource',
          function: 'migrateLegacyDismissalState',
        },
      })
    }
  }

  const pollForNotifications = async (): Promise<void> => {
    if (!currentCallback) {
      return
    }

    try {
      // Run migration on first poll
      await migrateLegacyDismissalState()

      const notifications = await fetchNotifications()
      currentCallback(notifications, 'legacy_intro_cards')
    } catch (error) {
      logger.error(error, {
        tags: { file: 'createExtensionLegacyBannersNotificationDataSource', function: 'pollForNotifications' },
      })
    }
  }

  const start = (onNotifications: (notifications: InAppNotification[], source: string) => void): void => {
    if (intervalId) {
      return
    }

    currentCallback = onNotifications

    pollForNotifications().catch((error) => {
      logger.error(error, {
        tags: { file: 'createExtensionLegacyBannersNotificationDataSource', function: 'start' },
      })
    })

    intervalId = setInterval(() => {
      pollForNotifications().catch((error) => {
        logger.error(error, {
          tags: { file: 'createExtensionLegacyBannersNotificationDataSource', function: 'setInterval' },
        })
      })
    }, pollIntervalMs)
  }

  const stop = async (): Promise<void> => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    currentCallback = null
  }

  return createNotificationDataSource({ start, stop })
}

/**
 * Fetches all notifications based on current conditions.
 * The processor will handle filtering based on tracked/processed state.
 *
 * Priority order (matches useSharedIntroCards):
 * 1. Recovery backup (if no external backup)
 * 2. Unitag claim (if eligible)
 */
async function fetchNotifications(): Promise<InAppNotification[]> {
  const notifications: InAppNotification[] = []

  // Priority 1: Recovery backup reminder
  const backupNotification = await checkRecoveryBackup()
  if (backupNotification) {
    notifications.push(backupNotification)
  }

  // Priority 2: Unitag claim
  const unitagNotification = await checkUnitagClaim()
  if (unitagNotification) {
    notifications.push(unitagNotification)
  }

  return notifications
}

/**
 * Check if recovery backup reminder should be shown.
 */
async function checkRecoveryBackup(): Promise<InAppNotification | null> {
  const state = getReduxStore().getState()
  const activeAccount = state.wallet.accounts[state.wallet.activeAccountAddress ?? '']

  if (!activeAccount || activeAccount.type !== AccountType.SignerMnemonic) {
    return null
  }

  const hasBackup = hasExternalBackup(activeAccount)
  if (hasBackup) {
    return null
  }

  return createRecoveryBackupBanner()
}

/**
 * Check if Unitag claim prompt should be shown.
 */
async function checkUnitagClaim(): Promise<InAppNotification | null> {
  const state = getReduxStore().getState()
  const activeAccount = state.wallet.accounts[state.wallet.activeAccountAddress ?? '']

  if (!activeAccount || activeAccount.type !== AccountType.SignerMnemonic) {
    return null
  }

  // Check if any account has a unitag by reading from React Query cache
  // Unitags are fetched via API and cached, not stored in Redux
  const accounts = Object.values(state.wallet.accounts) as Array<{ address?: string }>
  const hasAnyUnitag = accounts.some((account) => {
    if (!account.address) {
      return false
    }
    // Normalize the address the same way useUnitagsAddressQuery does
    // This ensures we match the exact query key format used when caching
    const validatedAddress = getValidAddress({ address: account.address, platform: Platform.EVM })
    if (!validatedAddress) {
      return false
    }

    // Read from React Query cache using the same query key as useUnitagsAddressQuery
    const queryKey = [ReactQueryCacheKey.UnitagsApi, 'address', { address: validatedAddress }]
    const cachedUnitag = SharedQueryClient.getQueryData<{ username?: string }>(queryKey)

    return !!cachedUnitag?.username
  })

  if (hasAnyUnitag) {
    return null
  }

  // Note: We can't check canClaimUnitag here since it requires an async query
  // The notification will be shown and processor will handle dismissal if already claimed
  return createUnitagClaimBanner()
}

/**
 * Create recovery backup banner notification
 */
function createRecoveryBackupBanner(): InAppNotification {
  return new Notification({
    id: RECOVERY_BACKUP_BANNER_ID,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.backup.title'),
      subtitle: i18n.t('onboarding.home.intro.backup.description.extension'),
      background: new Background({
        backgroundType: BackgroundType.UNSPECIFIED,
        backgroundOnClick: new OnClick({
          // No ACK here - required notifications should reappear until the user completes the backup
          // The notification will stop showing once hasExternalBackup() returns true
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS],
          onClickLink: `/${AppRoutes.Settings}/${SettingsRoutes.BackupRecoveryPhrase}`,
        }),
      }),
      // No onDismissClick - required cards cannot be dismissed
      buttons: [],
      iconLink: 'custom:shield-check-$accent1',
      // Encode cardType in extra field for IntroCard rendering
      extra: JSON.stringify({ cardType: 'required', graphicType: 'icon' }),
    }),
  })
}

/**
 * Create Unitag claim banner notification
 */
function createUnitagClaimBanner(): InAppNotification {
  // We need to construct a special action that will call focusOrCreateUnitagTab
  // Since we can't directly call functions from notification actions, we'll use a special internal link
  // that the navigation handler will recognize and handle specially
  const unitagClaimLink = `unitag://claim/${UnitagClaimRoutes.ClaimIntro}`

  return new Notification({
    id: UNITAG_CLAIM_BANNER_ID,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.unitag.title', { unitagDomain: UNITAG_SUFFIX_NO_LEADING_DOT }),
      subtitle: i18n.t('onboarding.home.intro.unitag.description'),
      background: new Background({
        backgroundType: BackgroundType.UNSPECIFIED,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: unitagClaimLink,
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
      iconLink: 'custom:person-$accent1',
      // Encode cardType in extra field for IntroCard rendering
      extra: JSON.stringify({ cardType: 'dismissible', graphicType: 'icon' }),
    }),
  })
}
