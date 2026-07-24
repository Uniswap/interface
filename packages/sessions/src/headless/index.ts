/**
 * Headless (Node) session client — entry point for Node-only consumers (anvil fork
 * bootstrap, CLI tooling, integration tests).
 *
 * Deliberately NOT re-exported from the package root: `createFileSessionStore` imports
 * `node:fs`, which must stay out of the web/extension/mobile bundle graphs that consume
 * `@universe/sessions`. Wire external access via a package `exports` subpath (the
 * `@universe/logger` `./server` pattern) when the first cross-package consumer lands.
 */
export { createFileSessionStore } from '@universe/sessions/src/headless/createFileSessionStore'
export type { FileSessionStore } from '@universe/sessions/src/headless/createFileSessionStore'
export {
  createHeadlessSessionClient,
  DEFAULT_GATEWAY_BASE_URL,
  HeadlessSessionBootstrapError,
} from '@universe/sessions/src/headless/createHeadlessSessionClient'
export type {
  CreateHeadlessSessionClientContext,
  HeadlessRequestSource,
  HeadlessSessionClient,
  HeadlessSessionHeaders,
} from '@universe/sessions/src/headless/createHeadlessSessionClient'
export { createSessionTransport, DEFAULT_RPC_TIMEOUT_MS } from '@universe/sessions/src/headless/createSessionTransport'
export type {
  CreateSessionTransportContext,
  SessionTransportFactory,
} from '@universe/sessions/src/headless/createSessionTransport'
