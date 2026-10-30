import { describe, expect, it } from 'vitest'
import { privyEmbeddedWalletBusinessMonitors } from './business'
import { MIN_WEB_SERVER_ERRORS, WEB_SERVER_ERRORS_ONLY } from './constants'
import { privyEmbeddedWalletEndpointMonitors } from './endpoints'
import { privyEmbeddedWalletErrorMonitors } from './errors'

const webErrorMonitors = [
  ...privyEmbeddedWalletEndpointMonitors.filter((m) => m.id.endsWith('_error_rate')),
  ...privyEmbeddedWalletBusinessMonitors,
  ...privyEmbeddedWalletErrorMonitors.filter((m) => m.id === 'privy_embedded_wallet_apm_error_rate'),
]

const scopeOf = (query: string, metric: string): string => {
  const match = query.match(new RegExp(`sum:${metric.replaceAll('.', '\\.')}\\{([^}]*)\\}`))
  return match?.[1] ?? ''
}

describe('web-span error numerators exclude handled 4xx', () => {
  it('covers every endpoint, business and aggregate monitor that reads the web span', () => {
    // 20 per-endpoint + 3 funnel + 1 aggregate; a new web-span monitor must join this list.
    expect(webErrorMonitors).toHaveLength(24)
    const readers = [
      ...privyEmbeddedWalletEndpointMonitors,
      ...privyEmbeddedWalletBusinessMonitors,
      ...privyEmbeddedWalletErrorMonitors,
    ].filter((m) => m.query.includes('trace.web.request.errors'))
    expect(readers.map((m) => m.id).sort()).toEqual(webErrorMonitors.map((m) => m.id).sort())
  })

  // Literal on purpose: the production constant must not be what the expectation is derived from.
  it('uses the negated 4xx tag filter that Datadog parses alongside comma-joined scopes', () => {
    expect(WEB_SERVER_ERRORS_ONLY).toBe('!http.status_code:4*')
  })

  it.each(webErrorMonitors)('$id filters 4xx out of errors but not out of hits', ({ query }) => {
    expect(scopeOf(query, 'trace.web.request.errors')).toContain(',!http.status_code:4*')
    expect(scopeOf(query, 'trace.web.request.hits')).not.toContain('http.status_code')
    expect(query).not.toContain('AND NOT')
  })

  it('renders the WalletSignIn 5xx monitor as the exact query that was validated against Datadog', () => {
    const monitor = privyEmbeddedWalletEndpointMonitors.find(
      (m) => m.id === 'privy_embedded_wallet_wallet_sign_in_error_rate',
    )
    const scope =
      'service:privy-embedded-wallet,env:prod,resource_name:post_/uniswap.privyembeddedwallet.v1.embeddedwalletservice/walletsignin'
    expect(monitor?.query).toBe(
      `sum(last_5m):( cutoff_min(sum:trace.web.request.errors{${scope},!http.status_code:4*}.as_count(), 2) / clamp_min(sum:trace.web.request.hits{${scope}}.as_count(), 20) ) * 100 > 5`,
    )
  })

  // Literal on purpose: the production constant must not be what the expectation is derived from.
  it('gates on at least 2 server errors, the most that still alerts on the 2026-10-09 Challenge outage', () => {
    expect(MIN_WEB_SERVER_ERRORS).toBe(2)
  })

  it.each(webErrorMonitors)('$id wraps the errors numerator in cutoff_min and leaves hits ungated', ({ query }) => {
    expect(query).toMatch(/cutoff_min\(sum:trace\.web\.request\.errors\{[^}]*\}\.as_count\(\), 2\)/)
    expect(query).not.toMatch(/cutoff_min\(sum:trace\.web\.request\.hits/)
    // A sum(last_Nm) cutoff_min gates on the window total; a rollup would split it across buckets.
    expect(query).not.toContain('.rollup(')
  })

  it.each(privyEmbeddedWalletBusinessMonitors)(
    '$id keeps the 100 - rate formula around the gated numerator',
    ({ query }) => {
      expect(query).toMatch(/^sum\(last_30m\):\( 100 - \( cutoff_min\(.*\) \/ clamp_min\(.*, \d+\) \) \* 100 \) < \d+$/)
    },
  )

  it.each(webErrorMonitors)('$id keeps a clamp_min denominator floor', ({ query }) => {
    expect(query).toMatch(/clamp_min\(sum:trace\.web\.request\.hits\{[^}]*\}\.as_count\(\), \d+\)/)
  })

  it.each(webErrorMonitors)('$id alert copy does not claim the floor is a request minimum', ({ alertBody }) => {
    expect(alertBody).not.toMatch(/Requires at least \d+ requests/)
  })

  it.each(webErrorMonitors)('$id alert copy states the server-error minimum', ({ alertBody }) => {
    expect(alertBody).toMatch(/at least \d+ server (errors|faults)/)
  })

  it.each(webErrorMonitors)('$id alert copy does not claim 4xx is watched by a paging monitor', ({ alertBody }) => {
    expect(alertBody).not.toMatch(/see the 4xx anomaly monitor/)
  })
})
