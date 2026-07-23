import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import {
  MIN_REQUESTS_5M,
  PRIVY_EMBEDDED_WALLET_RUNBOOK,
  SERVICE_README_URL,
  TEAM,
  apmTagFilter,
  rateDenominatorFloor,
} from './constants'

const env = settings.environment
const apmFilter = apmTagFilter(env)

// Volume floor for the Privy API error-rate monitor. privy-embedded-wallet is low-traffic and
// its Privy call volume is spiky (10m windows routinely dip to ~5-15 requests), so a single
// isolated 5xx against a tiny denominator can cross 5% and page even when nothing is wrong.
// clamp_min the denominator to the smallest count at which one 5xx stays under the 2% warning
// (ceil(100/2)=50), matching the rate-floor pattern the ALB/APM and per-endpoint error monitors
// already use — so a lone failure trips neither threshold, while a sustained rate still fires.
const privyApiErrorFloor = rateDenominatorFloor(2, MIN_REQUESTS_5M)

/**
 * Dependency monitors. Each external system this service talks to is a failure
 * domain that can take the whole flow down even when the service itself is fine:
 *
 *   Privy API   — outage = no signing, no wallet creation. Highest impact.
 *   Redis       — outage = Challenge fails = every endpoint fails. Critical.
 *   DynamoDB    — outage = no auth, no wallet lookup. Critical.
 *   KMS         — outage = no cookie encryption = session writes fail.
 *   CORS        — silent failure mode; rejected requests never reach the service.
 *
 * Some of these monitors rely on dd-trace auto-instrumentation for outbound
 * HTTP calls (api.privy.io) and AWS SDK calls (dynamodb, kms, elasticache).
 * Where AWS integration metrics aren't yet flowing for these specific
 * resources, the monitor uses trace data instead.
 */
export const privyEmbeddedWalletDepsMonitors: MonitorDefinition[] = [
  // ────────────────────────────────────────────────────────────────────────
  // Privy API — outbound HTTP calls to api.privy.io
  //
  // Scope outbound HTTP by `peer.hostname` — that is the tag dd-trace puts the
  // destination host on for client `http.request` spans (verified indexed on
  // trace.http.request for this service). `target.host` is NOT emitted, so any
  // monitor filtering on it evaluates to No Data and can never fire.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'privy_embedded_wallet_dep_privy_api_error_rate',
    name: 'Privy API error rate elevated',
    type: 'query alert',
    query: `sum(last_10m):( sum:trace.http.request.hits.by_http_status{${apmFilter},peer.hostname:api.privy.io,http.status_code:5*}.as_count() / clamp_min(sum:trace.http.request.hits{${apmFilter},peer.hostname:api.privy.io}.as_count(), ${privyApiErrorFloor}) ) * 100 > 5`,
    alertBody: `Outbound HTTP error rate to api.privy.io is above 5% over the last 10 minutes. Every signing operation and wallet creation routes through Privy — sustained failures here translate to user-visible auth/signing failures.\n\nCheck: Privy status page, recent deploys, IAM/network changes that could affect outbound HTTPS.\n\nRequires at least ${privyApiErrorFloor} requests in the window before the rate can alert.`,
    recoveryBody: 'Privy API error rate has recovered.',
    team: TEAM,
    priority: 1,
    thresholds: { critical: 5, warning: 2 },
    logQuery: 'service:privy-embedded-wallet @peer.hostname:api.privy.io status:error',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
  {
    id: 'privy_embedded_wallet_dep_privy_api_p95_latency',
    name: 'Privy API P95 latency elevated',
    type: 'query alert',
    query: `avg(last_10m):p95:trace.http.request{${apmFilter},peer.hostname:api.privy.io} > 3`,
    alertBody:
      'P95 latency on outbound calls to api.privy.io is above 3s over the last 10 minutes. Privy slowness propagates directly to user-visible latency on CreateWallet, SignMessage, SignTransaction, SignTypedData, and Sign7702Authorization.',
    recoveryBody: 'Privy API latency has recovered.',
    team: TEAM,
    priority: 2,
    thresholds: { critical: 3, warning: 2 },
    logQuery: 'service:privy-embedded-wallet @peer.hostname:api.privy.io',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },

  // ────────────────────────────────────────────────────────────────────────
  // CORS — log-based. The CORS rejection path returns 4xx with a specific
  // log shape; flag if rejections exceed a sustained baseline (legit clients
  // shouldn't get rejected, so any non-zero volume warrants investigation).
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'privy_embedded_wallet_dep_cors_rejections',
    name: 'CORS rejections on privy-embedded-wallet',
    type: 'log alert',
    query: `logs("service:privy-embedded-wallet env:${env} (\\"CORS\\" OR \\"origin not allowed\\" OR @error.kind:CorsError)").index("*").rollup("count").last("15m") > 50`,
    alertBody:
      'CORS rejections on privy-embedded-wallet exceeded 50 events in the last 15 minutes. Likely causes: (1) a frontend deploy introduced a new origin, (2) the allowed-origins config drifted, (3) third-party integration started calling from an unapproved origin.\n\nCheck the matching logs for the rejected `Origin` header value and trace it back to the calling client.',
    team: TEAM,
    priority: 2,
    thresholds: { critical: 50, warning: 10 },
    logQuery: `service:privy-embedded-wallet env:${env} ("CORS" OR "origin not allowed" OR @error.kind:CorsError)`,
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // Disable paging on this monitor for the initial rollout — we don't know
    // the natural baseline yet, and broken client integrations are not pageable.
    enablePaging: false,
    includeIncidentWebhook: false,
  },

  // ────────────────────────────────────────────────────────────────────────
  // DynamoDB — operation errors on either of the two service tables.
  // Trace-based; AWS integration metrics for these tables aren't yet flowing
  // to DD when this was authored. Once the integration covers them, this
  // can be replaced with `aws.dynamodb.throttled_requests` directly.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'privy_embedded_wallet_dep_dynamodb_errors',
    name: 'DynamoDB error spike (WalletStore + CredentialStore)',
    type: 'query alert',
    query: `sum(last_10m):sum:trace.aws.command.errors{${apmFilter},aws_service:dynamodb}.as_count() > 20`,
    alertBody:
      'DynamoDB operations from privy-embedded-wallet are erroring (>20 in 10m). Likely causes: throttling on the WalletStore or CredentialStore tables, IAM permission change, or partial AWS regional outage.\n\nCheck: AWS Console DynamoDB metrics for `privy-embedded-wallet-{env}` and `privy-embedded-wallet-credentials-{env}` tables, and recent IAM policy changes.',
    team: TEAM,
    priority: 1,
    thresholds: { critical: 20, warning: 5 },
    logQuery: 'service:privy-embedded-wallet @aws.service:dynamodb status:error',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Redis — challenge storage. Outage cascades because every authenticated
  // endpoint requires a Challenge round-trip first.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'privy_embedded_wallet_dep_redis_errors',
    name: 'Redis cluster errors (challenge storage)',
    type: 'query alert',
    query: `sum(last_5m):sum:trace.redis.command.errors{${apmFilter}}.as_count() > 10`,
    alertBody:
      'Redis errors on privy-embedded-wallet exceeded 10 in 5 minutes. Challenge sessions are stored in the rediscluster-privy-wallet ElastiCache cluster — Redis problems break every authenticated flow (sign-in, signing, recovery) because every call requires a Challenge first.\n\nCheck the ElastiCache console for cluster health, node failovers, or evictions.',
    team: TEAM,
    priority: 1,
    thresholds: { critical: 10, warning: 3 },
    logQuery: 'service:privy-embedded-wallet @redis.command:* status:error',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },

  // ────────────────────────────────────────────────────────────────────────
  // KMS — used for session cookie encryption-key access (and any aws-encryption
  // SDK paths). Failures here cause session writes to fail, blocking
  // CreateWallet and AddAuthenticator completion.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'privy_embedded_wallet_dep_kms_errors',
    name: 'KMS errors',
    type: 'query alert',
    query: `sum(last_10m):sum:trace.aws.command.errors{${apmFilter},aws_service:kms}.as_count() > 5`,
    alertBody:
      'KMS errors from privy-embedded-wallet exceeded 5 in 10 minutes. KMS is on the cookie encryption path — failures here cause session writes to fail, breaking CreateWallet and AddAuthenticator completion (and any other flow that returns a session cookie).\n\nCheck: KMS key policy / grants, IAM role permissions, AWS service health for KMS in us-east-2.',
    team: TEAM,
    priority: 2,
    thresholds: { critical: 5, warning: 2 },
    logQuery: 'service:privy-embedded-wallet @aws.service:kms status:error',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
]
