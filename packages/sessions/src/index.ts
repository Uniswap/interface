/** biome-ignore-all assist/source/organizeImports: we want to manually group exports by category */

/**
 * @universe/sessions
 *
 * This is the ONLY public entry point for the Sessions package.
 * All exports must be explicitly listed here.
 * Deep imports are forbidden and will be blocked by ESLint.
 */

// Device ID
export { createDeviceIdService } from '@universe/sessions/src/device-id/createDeviceIdService'
export type { DeviceIdService } from '@universe/sessions/src/device-id/types'
// Session Repository
export { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
export type { SessionRepository } from '@universe/sessions/src/session-repository/types'

// Session Service
export { createNoopSessionService } from '@universe/sessions/src/session-service/createNoopSessionService'
export { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
export type { SessionService } from '@universe/sessions/src/session-service/types'

// Session Storage
export { createSessionStorage } from '@universe/sessions/src/session-storage/createSessionStorage'
export type { SessionStorage } from '@universe/sessions/src/session-storage/types'

// Session Client
export { createSessionClient } from '@universe/sessions/src/session-repository/createSessionClient'
export type { SessionServiceClient } from '@universe/sessions/src/session-repository/createSessionClient'
export { createTransport } from '@universe/sessions/src/session-repository/transport'
