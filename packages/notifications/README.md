# @universe/notifications

Client-side notification system for fetching, processing, storing, and displaying notifications from a backend service.

## Architecture

```
NotificationSystem (orchestrator)
├── NotificationDataSource        → Fetch/websocket notification data
├── NotificationTracker           → No-op (backend handles deduplication)
├── NotificationProcessor         → Filter & prioritize notifications
├── NotificationChainCoordinator  → Handle multi-step notification flows
└── NotificationRenderer          → Platform-specific UI rendering
```

## Core Concepts

### Notification Chains
Notifications can trigger follow-up notifications based on user actions:
```json
{
  "notificationName": "welcome_step_1",
  "content": {
    "buttons": [{
      "text": "Next",
      "onClickType": "ON_CLICK_TYPE_DISMISS_AND_POPUP",
      "onClickLink": "welcome_step_2"  // ← triggers next notification
    }]
  }
}
```

## Usage

### Initialize the System

```typescript
import { createNotificationSystem } from '@universe/notifications'

const notificationSystem = createNotificationSystem({
  dataSources: [getFetchNotificationDataSource({ apiClient })],
  tracker: createNoopNotificationTracker(),
  processor: createNotificationProcessor(),
  renderer: createNotificationRenderer(),
  chainCoordinator: createNotificationChainCoordinator()
})

await notificationSystem.initialize()
```

### Handle User Actions

```typescript
// When user clicks a button
notificationSystem.onButtonClick(notificationName, button)

// When user dismisses
notificationSystem.onDismiss(notificationName)

// When user clicks background
notificationSystem.onBackgroundClick(notificationName)
```

### React Integration

```tsx
// Mount container at app root
<NotificationContainer />

// Container reads from Zustand store
const activeNotifications = useNotificationStore(state => state.activeNotifications)
const notificationSystem = useNotificationStore(state => state.notificationSystem)
```
