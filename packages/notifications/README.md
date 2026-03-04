# @universe/notifications

A platform-agnostic notification service for fetching, processing, storing, and displaying in-app notifications across web, mobile, and extension platforms.

## Table of Contents

- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
  - [Notification Types](#notification-types-contentstyle)
  - [Data Source Patterns](#data-source-patterns)
  - [Notification Chains](#notification-chains)
  - [Notification ID Conventions](#notification-id-conventions)
  - [User Actions](#user-actions-onclickaction)
- [Getting Started](#getting-started)
- [Platform Integrations](#platform-integrations)
  - [Web](#web-integration)
  - [Mobile](#mobile-integration)
  - [Extension](#extension-integration)
- [Common Patterns](#common-patterns)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NotificationService                             │
│                           (Orchestrator)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐  │
│   │   DataSources    │────▶│    Processor      │────▶│   Renderer   │  │
│   │                  │     │                   │     │              │  │
│   │ • Polling (API)  │     │ • Filters tracked │     │ • canRender  │  │
│   │ • Reactive       │     │ • Limits by style │     │ • render()   │  │
│   │ • LocalTrigger   │     │ • Separates chains│     │ • cleanup()  │  │
│   │ • Interval       │     │                   │     │              │  │
│   └──────────────────┘     └───────────────────┘     └──────────────┘  │
│            │                        │                       │          │
│            │                        ▼                       │          │
│            │               ┌───────────────────┐            │          │
│            │               │     Tracker       │◀───────────┘          │
│            │               │                   │                       │
│            │               │ • isProcessed()   │                       │
│            │               │ • track()         │                       │
│            │               │ • cleanup()       │                       │
│            │               └───────────────────┘                       │
│            │                        │                                  │
│            ▼                        ▼                                  │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                         Telemetry                                │  │
│   │  onNotificationReceived → onNotificationShown → onInteracted    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **DataSource** | Feeds notifications to the service (API polling, state subscriptions, local triggers) |
| **Processor** | Filters tracked notifications, enforces style limits, separates primary vs chained |
| **Renderer** | Platform-specific UI rendering with canRender/render/cleanup lifecycle |
| **Tracker** | Tracks acknowledged notifications to prevent re-showing |
| **Telemetry** | Reports lifecycle events (received, shown, interacted) to analytics |

### Lifecycle

1. **Initialize** — Service starts all data sources
2. **Receive** — Data sources emit notifications to the service
3. **Process** — Processor filters and categorizes notifications
4. **Render** — Renderer displays primary notifications, stores chained for later
5. **Interact** — User clicks trigger actions (DISMISS, ACK, POPUP, EXTERNAL_LINK)
6. **Track** — ACK action marks notification as processed
7. **Destroy** — Service cleans up data sources and active renders

## Core Concepts

### Notification Types (ContentStyle)

| Style | Description | Max Concurrent | Typical Use |
|-------|-------------|----------------|-------------|
| `MODAL` | Full-screen overlays requiring user action | 1 | Feature announcements, onboarding flows |
| `SYSTEM_BANNER` | System alerts (typically at screen bottom) | 1 | Offline status, storage warnings |
| `LOWER_LEFT_BANNER` | Promotional banners stacked in lower-left | 3 | Chain promotions, feature highlights |

### Data Source Patterns

The service supports four patterns for feeding notifications:

#### 1. Polling (Backend API via React Query)

Best for: Backend-driven notifications with automatic caching and refetch.

```typescript
import { createPollingNotificationDataSource, getNotificationQueryOptions } from '@universe/notifications'

const pollingDataSource = createPollingNotificationDataSource({
  queryClient,
  queryOptions: getNotificationQueryOptions({ address, platformType, appId }),
})
```

#### 2. Reactive (Push-based Subscriptions)

Best for: Instant response to state changes (network status, storage quota).

```typescript
import { createReactiveDataSource, type ReactiveCondition } from '@universe/notifications'

const offlineCondition: ReactiveCondition<{ isConnected: boolean }> = {
  notificationId: 'local:session:offline',
  subscribe: (onStateChange) => {
    return NetInfo.addEventListener((state) => {
      onStateChange({ isConnected: state.isConnected })
    })
  },
  shouldShow: (state) => state.isConnected === false,
  createNotification: () => new Notification({ /* ... */ }),
}

const reactiveDataSource = createReactiveDataSource({
  condition: offlineCondition,
  tracker,
})
```

#### 3. LocalTrigger (Condition-based Polling)

Best for: Periodic checks of local state (Redux selectors, app conditions).

```typescript
import { createLocalTriggerDataSource, type TriggerCondition } from '@universe/notifications'

const backupTrigger: TriggerCondition = {
  id: 'local:backup_reminder',
  shouldShow: async () => {
    const account = selectActiveAccount(getState())
    return account && !hasExternalBackup(account)
  },
  createNotification: () => new Notification({ /* ... */ }),
  onAcknowledge: () => dispatch(setLastSeenTs(Date.now())),
}

const localTriggerDataSource = createLocalTriggerDataSource({
  triggers: [backupTrigger],
  tracker,
  pollIntervalMs: 5000,
})
```

#### 4. Interval (Simple Periodic Checks)

Best for: Custom periodic notification fetching.

```typescript
import { createIntervalNotificationDataSource } from '@universe/notifications'

const intervalDataSource = createIntervalNotificationDataSource({
  pollIntervalMs: 30000,
  source: 'legacy_banners',
  logFileTag: 'LegacyBanners',
  getNotifications: async () => fetchLegacyBanners(),
})
```

### Notification Chains

Notifications can trigger follow-up notifications using the `POPUP` action:

```typescript
// Step 1: User sees welcome banner
{
  id: 'welcome_step_1',
  content: {
    buttons: [{
      text: 'Learn More',
      onClick: {
        onClick: [OnClickAction.DISMISS, OnClickAction.POPUP],
        onClickLink: 'welcome_step_2'  // ← triggers next notification
      }
    }]
  }
}

// Step 2: Detailed modal (stored as "chained" until triggered)
{
  id: 'welcome_step_2',
  content: { style: ContentStyle.MODAL, /* ... */ }
}
```

The processor automatically identifies root vs chained notifications using graph analysis.

### Notification ID Conventions

| Prefix | Storage | Behavior |
|--------|---------|----------|
| (none) | API + localStorage | Permanent tracking, synced with backend |
| `local:` | localStorage only | Permanent tracking, local only (no API calls) |
| `local:session:` | sessionStorage | Resets on app restart (e.g., offline banner) |

### User Actions (OnClickAction)

| Action | Effect |
|--------|--------|
| `DISMISS` | Hides the notification (can reappear if not ACK'd) |
| `ACK` | Marks as acknowledged, prevents re-showing |
| `POPUP` | Shows the notification specified in `onClickLink` |
| `EXTERNAL_LINK` | Navigates to URL in `onClickLink` via `onNavigate` handler |

Actions are combined in arrays and executed sequentially:
```typescript
onClick: [OnClickAction.DISMISS, OnClickAction.ACK]  // Hide and mark processed
onClick: [OnClickAction.DISMISS, OnClickAction.POPUP]  // Hide and show next
```

## Getting Started

### Initialize the Service

```typescript
import {
  createNotificationService,
  createPollingNotificationDataSource,
  createBaseNotificationProcessor,
  createNotificationTracker,
  createNotificationRenderer,
  createNotificationTelemetry,
} from '@universe/notifications'

const notificationService = createNotificationService({
  dataSources: [
    createPollingNotificationDataSource({ queryClient, queryOptions }),
    // Add more data sources as needed
  ],
  tracker: createNotificationTracker(storageAdapter),
  processor: createBaseNotificationProcessor(tracker),
  renderer: createNotificationRenderer({ onRender, canRender }),
  telemetry: createNotificationTelemetry({ analytics }),
  onNavigate: (url) => window.open(url, '_blank'),
})

await notificationService.initialize()
```

### Handle User Interactions

```typescript
// When user clicks a button (index 0)
notificationService.onNotificationClick(notificationId, { type: 'button', index: 0 })

// When user clicks the dismiss/close button
notificationService.onNotificationClick(notificationId, { type: 'dismiss' })

// When user clicks the background
notificationService.onNotificationClick(notificationId, { type: 'background' })

// When notification is shown to user (for telemetry)
notificationService.onNotificationShown(notificationId)

// When render fails (e.g., unknown notification style)
notificationService.onRenderFailed(notificationId)
```

### Cleanup

```typescript
// On unmount or navigation
notificationService.destroy()
```

## Platform Integrations

### Web Integration

**Location:** `apps/web/src/notification-service/`

```
apps/web/src/notification-service/
├── WebNotificationService.tsx          # Service initialization
├── createLocalStorageAdapter.ts        # localStorage-based tracker
├── notification-renderer/
│   ├── NotificationContainer.tsx       # Renders all notification types
│   ├── StackedLowerLeftBanners.tsx     # Framer-motion stacking animations
│   ├── notificationStore.ts            # Zustand store for UI state
│   └── components/
│       └── SystemBannerNotification.tsx
├── data-sources/
│   ├── createLegacyBannersNotificationDataSource.ts
│   └── createSystemAlertsDataSource.ts
└── telemetry/
    └── getNotificationTelemetry.ts
```

**Key features:**
- Zustand store pattern for UI state management
- Framer-motion animations for stacked banners
- localStorage-based notification tracking

### Mobile Integration

**Location:** `apps/mobile/src/notification-service/`

```
apps/mobile/src/notification-service/
├── MobileNotificationServiceManager.tsx  # Service manager component
├── MobileNotificationService.ts          # Service initialization
├── createMobileStorageAdapter.ts         # MMKV-based tracker
├── handleNotificationNavigation.ts       # Navigation handler
├── notification-renderer/
│   ├── NotificationContainer.tsx         # Routes to custom renderers
│   ├── SystemBannerPortal.tsx            # Portal for system banners
│   └── createMobileNotificationRenderer.ts
├── renderers/
│   ├── BackupReminderModalRenderer.tsx   # Custom modal for backup reminder
│   └── OfflineBannerRenderer.tsx         # Custom banner for offline state
├── triggers/
│   ├── backupReminderTrigger.ts          # LocalTrigger example
│   └── createMobileLocalTriggerDataSource.ts
└── data-sources/
    ├── reactive/
    │   └── offlineCondition.ts           # ReactiveCondition example
    └── banners/                          # Legacy banner data sources
```

**Key features:**
- MMKV storage for high-performance tracking
- Custom renderers for platform-specific UI (BackupReminder, OfflineBanner)
- NetInfo integration for offline detection via reactive data source

### Extension Integration

**Location:** `apps/extension/src/notification-service/`

```
apps/extension/src/notification-service/
├── ExtensionNotificationServiceManager.tsx  # Service manager
├── ExtensionNotificationService.tsx         # Service initialization
├── createChromeStorageAdapter.ts            # Chrome Storage API tracker
├── notification-renderer/
│   ├── NotificationContainer.tsx
│   └── notificationStore.ts
├── renderers/
│   ├── AppRatingModalRenderer.tsx
│   └── StorageWarningModalRenderer.tsx
├── triggers/
│   ├── appRatingTrigger.ts
│   └── createExtensionLocalTriggerDataSource.ts
└── data-sources/
    └── reactive/
        └── storageWarningCondition.ts       # Storage quota monitoring
```

**Key features:**
- Chrome Storage API for cross-session persistence
- Storage quota monitoring via reactive data source
- Special navigation handling (e.g., `unitag://` protocol)

## Common Patterns

### Creating a Local Trigger

```typescript
import { type TriggerCondition } from '@universe/notifications'

export const REMINDER_NOTIFICATION_ID = 'local:my_reminder'

interface CreateReminderTriggerContext {
  getState: () => AppState
  dispatch: (action: AnyAction) => void
}

export function createReminderTrigger(ctx: CreateReminderTriggerContext): TriggerCondition {
  const { getState, dispatch } = ctx

  return {
    id: REMINDER_NOTIFICATION_ID,

    shouldShow: async () => {
      const state = getState()
      const lastSeen = selectReminderLastSeen(state)
      return Date.now() - lastSeen > ONE_DAY_MS
    },

    createNotification: () => new Notification({
      id: REMINDER_NOTIFICATION_ID,
      content: new Content({
        style: ContentStyle.MODAL,
        title: 'Reminder',
        onDismissClick: new OnClick({
          onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
        }),
      }),
    }),

    onAcknowledge: () => {
      dispatch(setReminderLastSeen(Date.now()))
    },
  }
}
```

### Creating a Reactive Condition

```typescript
import { type ReactiveCondition } from '@universe/notifications'

export const STATUS_NOTIFICATION_ID = 'local:session:status'

interface StatusState {
  isActive: boolean
}

export function createStatusCondition(ctx: { getState: () => AppState }): ReactiveCondition<StatusState> {
  return {
    notificationId: STATUS_NOTIFICATION_ID,

    subscribe: (onStateChange) => {
      // Subscribe to external state changes
      const unsubscribe = someService.addEventListener((event) => {
        onStateChange({ isActive: event.isActive })
      })
      return unsubscribe
    },

    shouldShow: (state) => state.isActive === false,

    createNotification: (state) => new Notification({
      id: STATUS_NOTIFICATION_ID,
      content: new Content({
        style: ContentStyle.SYSTEM_BANNER,
        title: 'Service unavailable',
        onDismissClick: new OnClick({
          onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
        }),
      }),
    }),
  }
}
```

### Custom Renderer with Notification Routing

```typescript
import { createNotificationRenderer } from '@universe/notifications'

function isMyCustomNotification(notification: InAppNotification): boolean {
  return notification.id === 'local:my_custom'
}

const renderer = createNotificationRenderer({
  canRender: (notification) => {
    // Only one modal at a time
    if (notification.content?.style === ContentStyle.MODAL) {
      return !hasActiveModal()
    }
    return true
  },

  render: (notification) => {
    // Route to appropriate renderer
    if (isMyCustomNotification(notification)) {
      return renderMyCustomModal(notification)
    }
    return renderDefaultNotification(notification)
  },
})
```

## Testing

### Mock Data Source

```typescript
function createMockDataSource(): NotificationDataSource & {
  emit: (notifications: InAppNotification[]) => void
} {
  let callback: ((notifications: InAppNotification[], source: string) => void) | null = null

  return {
    start: (onNotifications) => { callback = onNotifications },
    stop: async () => { callback = null },
    emit: (notifications) => callback?.(notifications, 'mock'),
  }
}

// In tests
const mockDataSource = createMockDataSource()
const service = createNotificationService({
  dataSources: [mockDataSource],
  // ...
})

await service.initialize()
mockDataSource.emit([testNotification])
```

### Mock Tracker

```typescript
function createMockTracker(): NotificationTracker {
  const processed = new Set<string>()

  return {
    isProcessed: async (id) => processed.has(id),
    getProcessedIds: async () => processed,
    track: async (id) => { processed.add(id) },
    cleanup: async () => { processed.clear() },
  }
}
```

### Mock Renderer

```typescript
function createMockRenderer(): NotificationRenderer & {
  rendered: InAppNotification[]
} {
  const rendered: InAppNotification[] = []

  return {
    rendered,
    canRender: () => true,
    render: (notification) => {
      rendered.push(notification)
      return () => {
        const index = rendered.indexOf(notification)
        if (index > -1) rendered.splice(index, 1)
      }
    },
  }
}
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Notification re-appears after dismiss | Using `DISMISS` without `ACK` | Add `ACK` to the onClick array |
| Notification never shows | Already tracked as processed | Clear storage or use a new notification ID |
| Chained notification not showing | Target not in chained map | Ensure API returns all chain members in same response |
| Multiple modals appearing | `canRender` not checking active modals | Implement modal count check in renderer |
| Session notification persists | Using `local:` instead of `local:session:` | Use `local:session:` prefix for session-scoped notifications |
| Reactive condition not updating | Not calling `onStateChange` | Ensure subscribe callback is invoked on state changes |

