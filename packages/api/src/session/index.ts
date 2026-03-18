/* eslint-disable check-file/no-index */
/**
 * Session Transport
 *
 * Pure factory functions for creating session-aware transports.
 * These have no platform detection - the caller provides all configuration.
 */

export {
  type CreateSessionTransportOptions,
  createSessionTransport,
} from '@universe/api/src/session/createSessionTransport'
