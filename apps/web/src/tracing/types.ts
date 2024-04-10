import { ConnectionType } from 'connection/types'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'

/**
 * A short code identifying the type of operation, typically following [OpenTelemetry's semantic conventions][1].
 * See https://develop.sentry.dev/sdk/performance/span-operations/#browser.
 *
 * [1]: https://github.com/open-telemetry/opentelemetry-specification/blob/24de67b3827a4e3ab2515cd8ab62d5bcf837c586/specification/trace/semantic_conventions/README.md
 */
export type OpCode =
  // Please keep this alphabetized for ease-of-use.
  | 'http.client'
  | 'http.graphql.query'
  | 'http.json_rpc'
  | 'quote'
  | 'quote.quick_route'
  | 'quote.server'
  | 'quote.client'
  | 'permit.allowance'
  | 'permit.permit2.signature'
  | 'send'
  | 'swap.classic'
  | 'swap.wrap'
  | 'swap.x.dutch'
  | 'swap.x.limit'
  | 'wallet.approve'
  | 'wallet.connect'
  | 'wallet.connect.eager'
  | 'wallet.estimate_gas'
  | 'wallet.send_transaction'
  | 'wallet.sign'
  | 'wallet.switch_chain'

export type TraceContext = {
  /** The human-readable name of the trace. */
  name: string
  /** A short code identifying the type of operation. */
  op: OpCode
  /** Arbitrary data stored on a trace. */
  data?: Record<string, unknown>
  /** Indexed (ie searchable) tags associated with a trace. */
  // Typed tags ensures that the traced operations always have the appropriate tags.
  // It also prevents unknown tags from being added to traced operations.
  tags?: Record<string, Primitive>
} & (
  | { tags?: never }
  | { op: 'http.client'; tags: { host: string } }
  | { op: 'http.graphql.query'; tags: { host: string; chain?: Chain; operation?: string; address?: string } }
  | { op: 'http.json_rpc'; tags: { host: string; chain?: Chain; method?: string } }
  | { op: 'wallet.connect' | 'wallet.connect.eager'; tags: { type: ConnectionType; wallet?: string } }
)
