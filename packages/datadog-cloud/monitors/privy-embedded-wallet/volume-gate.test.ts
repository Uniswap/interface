import { describe, expect, it } from 'vitest'
import { privyEmbeddedWalletAvailabilityMonitors } from './availability'
import { privyEmbeddedWalletBusinessMonitors } from './business'
import {
  DEP_LATENCY_ROLLUP_ADJECTIVE,
  DEP_LATENCY_ROLLUP_SECONDS,
  DEP_LATENCY_WINDOW,
  DEP_LATENCY_WINDOW_LABEL,
  DEP_LATENCY_WINDOW_SECONDS,
  LATENCY_AGGREGATION,
  LATENCY_ROLLUP_ADJECTIVE,
  LATENCY_ROLLUP_LABEL,
  LATENCY_ROLLUP_SECONDS,
  LATENCY_WINDOW,
  LATENCY_WINDOW_LABEL,
  LATENCY_WINDOW_SECONDS,
  MIN_REQUESTS_AGGREGATE_LATENCY,
  MIN_REQUESTS_DEP_LATENCY,
  MIN_REQUESTS_PER_RPC_LATENCY,
  minFailuresToAlert,
  rateDenominatorFloor,
  volumeGatedPercentile,
} from './constants'
import { privyEmbeddedWalletDepsMonitors } from './deps'
import { privyEmbeddedWalletEndpointMonitors } from './endpoints'
import { privyEmbeddedWalletErrorMonitors } from './errors'
import { privyEmbeddedWalletKillSwitchMonitors } from './killswitch'
import { privyEmbeddedWalletLatencyMonitors } from './latency'
import { privyEmbeddedWalletSecurityMonitors } from './security'

/** Every monitor this service ships, so service-wide guards cannot miss a file. */
const allMonitors = [
  ...privyEmbeddedWalletAvailabilityMonitors,
  ...privyEmbeddedWalletBusinessMonitors,
  ...privyEmbeddedWalletDepsMonitors,
  ...privyEmbeddedWalletEndpointMonitors,
  ...privyEmbeddedWalletErrorMonitors,
  ...privyEmbeddedWalletKillSwitchMonitors,
  ...privyEmbeddedWalletLatencyMonitors,
  ...privyEmbeddedWalletSecurityMonitors,
]

const latencyMonitors = privyEmbeddedWalletEndpointMonitors.filter((m) => m.id.endsWith('_latency_p95'))
const rateMonitors = privyEmbeddedWalletEndpointMonitors.filter((m) => m.id.endsWith('_error_rate'))
const gatedAggregates = privyEmbeddedWalletLatencyMonitors.filter(
  (m) => m.id === 'privy_embedded_wallet_latency_p95' || m.id === 'privy_embedded_wallet_apm_p95_aggregate',
)
// The outbound-dependency p95 runs the same gate on its own, tighter cadence, so it shares the
// operator assertions but not the window ones.
const gatedDeps = privyEmbeddedWalletDepsMonitors.filter(
  (m) => m.id === 'privy_embedded_wallet_dep_privy_api_p95_latency',
)
/** Everything on the service's 30-minute rollup / 1-hour window cadence. */
const gatedMonitors = [...latencyMonitors, ...gatedAggregates]
/** Every monitor using the cutoff_min volume gate, whatever its cadence. */
const allGatedMonitors = [...gatedMonitors, ...gatedDeps]

/** Model of Datadog's `cutoff_min`: null below the floor, the value itself at or above it. */
const cutoffMin = (value: number, floor: number): number | null => (value < floor ? null : value)

/** What one rolled-up bucket scores against the threshold; null means the monitor cannot evaluate. */
const gatedScore = (percentile: number, hits: number, floor: number): number | null => {
  const divisor = cutoffMin(hits, floor)
  return divisor === null ? null : (percentile * hits) / divisor
}

/** The old gate, for contrast: `clamp_min` keeps the point and rescales the threshold. */
const clampedScore = (percentile: number, hits: number, floor: number): number =>
  (percentile * hits) / Math.max(hits, floor)

describe('cutoff_min gate semantics', () => {
  it('drops the point entirely below the floor', () => {
    for (const hits of [0, 1, MIN_REQUESTS_PER_RPC_LATENCY - 1]) {
      expect(cutoffMin(hits, MIN_REQUESTS_PER_RPC_LATENCY)).toBeNull()
      expect(gatedScore(10, hits, MIN_REQUESTS_PER_RPC_LATENCY)).toBeNull()
    }
  })

  it('is the identity at or above the floor, to floating-point rounding', () => {
    // hits / cutoff_min(hits, floor) is 1 once the floor is cleared, up to floating-point rounding.
    for (const hits of [MIN_REQUESTS_PER_RPC_LATENCY, 8, 21, 108, 434]) {
      for (const p95 of [0.004, 0.0989, 0.4262, 1.5, 10.048786422998814]) {
        const score = gatedScore(p95, hits, MIN_REQUESTS_PER_RPC_LATENCY)
        expect(score).not.toBeNull()
        expect(Math.abs((score as number) - p95) / p95).toBeLessThan(1e-15)
      }
    }
  })

  it('differs from clamp_min exactly where the bug lived', () => {
    // Below the floor clamp_min still scores, scaled by hits/floor: the threshold silently becomes
    // `threshold * floor / hits`. 20 is the floor the old gate shipped with.
    const p95 = 10.048786422998814
    expect(clampedScore(p95, 1, 20)).toBeCloseTo(0.50244, 5)
    expect(gatedScore(p95, 1, 20)).toBeNull()
  })

  it('rescales rather than gates on the real api.privy.io traffic the deps monitor sees', () => {
    // Median 10m bucket was 18 requests against a floor of 50, so a nominal 3s threshold was
    // really 3 * 50 / 18 = 8.3s. The 2026-10-02 22:00Z bucket (17 hits, p95 2.239s) scored 0.761s.
    expect(clampedScore(2.239, 17, 50)).toBeCloseTo(0.7613, 4)
    expect(gatedScore(2.239, 17, MIN_REQUESTS_DEP_LATENCY)).toBeCloseTo(2.239, 12)
  })
})

describe('the single-outlier false positives', () => {
  // Two GetRecoveryConfig buckets where a lone ~10s call paged under the old gate; the real p95
  // excluded it both times.
  const cases = [
    { date: '2026-08-15', hits: 7, trueP95: 0.3326 },
    { date: '2026-10-05', hits: 8, trueP95: 0.3224 },
  ]
  const critical = latencyMonitors.find((m) => m.id === 'privy_embedded_wallet_get_recovery_config_latency_p95')
    ?.thresholds?.critical as number

  it('paged under the old per-request clamp_min gate', () => {
    // 10.048786 * 1 / 20 = 0.502s against a 0.5s threshold.
    expect(clampedScore(10.048786422998814, 1, 20)).toBeGreaterThan(0.5)
  })

  it.each(cases)('$date evaluates under the new gate and scores far below the threshold', ({ hits, trueP95 }) => {
    // Both buckets evaluate at a floor of 3 and score nowhere near the threshold.
    const score = gatedScore(trueP95, hits, MIN_REQUESTS_PER_RPC_LATENCY)
    expect(score).toBeCloseTo(trueP95, 12)
    expect(score).toBeLessThan(critical)
  })
})

describe('a real regression at real volume still alerts', () => {
  // Challenge serves a median of 108 requests per 30-minute bucket, so it clears the floor.
  it('passes the percentile through untouched at Challenge volume', () => {
    const hits = 108
    for (const p95 of [0.4262, 0.51, 0.9, 2.0]) {
      const score = gatedScore(p95, hits, MIN_REQUESTS_PER_RPC_LATENCY)
      expect(score).toBeCloseTo(p95, 12)
      expect(score !== null && score > 1).toBe(p95 > 1)
    }
  })

  it('needs enough samples that the p95 is not just the slowest request', () => {
    // Datadog returns the quantile at index floor(q*(n-1)) + 1 (1-based); checked against prod
    // spans, e.g. n=8 on 2026-10-05 18:00Z gave p95 0.3224 = #7 of 8 (max 10.0007).
    const p95Rank = (n: number): number => Math.floor(0.95 * (n - 1)) + 1
    expect(p95Rank(2)).toBe(1) // the faster of the two, hence a floor of 3
    expect(p95Rank(3)).toBe(2)
    expect(p95Rank(5)).toBe(4)
    expect(p95Rank(8)).toBe(7)
    expect(p95Rank(20)).toBe(19)

    // Exactly one request is excluded for n in 2..21, so a higher floor adds no outlier protection.
    for (let n = 2; n <= 21; n++) {
      expect(n - p95Rank(n)).toBe(1)
    }
    expect(MIN_REQUESTS_PER_RPC_LATENCY).toBe(3)
    expect(MIN_REQUESTS_DEP_LATENCY).toBe(3)
  })
})

describe('latency volume gate query shape', () => {
  it('creates a p95 monitor and a 5xx rate monitor for every endpoint', () => {
    expect(latencyMonitors).toHaveLength(20)
    expect(rateMonitors).toHaveLength(20)
    expect(gatedAggregates).toHaveLength(2)
    expect(gatedDeps).toHaveLength(1)
  })

  it.each(allGatedMonitors)('$id gates with cutoff_min, never clamp_min', ({ query }) => {
    expect(query).toContain('cutoff_min(')
    expect(query).not.toContain('clamp_min(')
  })

  it.each(gatedMonitors)('$id rolls both terms up to the gate interval', ({ query }) => {
    expect(query).toContain(`.rollup(avg, ${LATENCY_ROLLUP_SECONDS})`)
    expect(query).toContain(`.rollup(sum, ${LATENCY_ROLLUP_SECONDS})`)
  })

  it.each(gatedDeps)('$id rolls both terms up to the dependency gate interval', ({ query }) => {
    expect(query).toContain(`.rollup(avg, ${DEP_LATENCY_ROLLUP_SECONDS})`)
    expect(query).toContain(`.rollup(sum, ${DEP_LATENCY_ROLLUP_SECONDS})`)
  })

  it.each(gatedMonitors)('$id evaluates over the configured window', ({ query }) => {
    expect(query).toMatch(new RegExp(`^${LATENCY_AGGREGATION}\\(${LATENCY_WINDOW}\\):`))
  })

  it.each(gatedDeps)('$id evaluates over the configured dependency window', ({ query }) => {
    expect(query).toMatch(new RegExp(`^${LATENCY_AGGREGATION}\\(${DEP_LATENCY_WINDOW}\\):`))
  })

  it.each(allGatedMonitors)('$id never combines .as_count() with an explicit rollup', ({ query }) => {
    // Datadog rejects `.as_count()` with an explicit rollup unless the aggregator is `sum`.
    expect(query).not.toContain('.as_count()')
  })

  it('runs a window at least twice the rollup so a whole bucket always fits inside it', () => {
    expect(LATENCY_WINDOW_SECONDS).toBeGreaterThanOrEqual(2 * LATENCY_ROLLUP_SECONDS)
    expect(DEP_LATENCY_WINDOW_SECONDS).toBeGreaterThanOrEqual(2 * DEP_LATENCY_ROLLUP_SECONDS)
  })

  it.each(latencyMonitors)('$id floors at the per-RPC request count', ({ query }) => {
    expect(query).toContain(`, ${MIN_REQUESTS_PER_RPC_LATENCY})`)
  })

  it.each(gatedAggregates)('$id floors at the aggregate request count', ({ query }) => {
    expect(query).toContain(`, ${MIN_REQUESTS_AGGREGATE_LATENCY})`)
  })

  it.each(gatedDeps)('$id floors at the dependency request count', ({ query }) => {
    expect(query).toContain(`, ${MIN_REQUESTS_DEP_LATENCY})`)
  })

  // Above the floor the gate must be exactly 1, which needs numerator and divisor to be the same
  // rolled-up hits expression.
  it.each(allGatedMonitors)('$id multiplies and divides by the same rolled-up hits', ({ query }) => {
    // Greedy: the rolled-up hits expression itself ends in `, 1800)`.
    const gate = query.match(/\* (.+) \/ cutoff_min\((.+), \d+\)/)
    expect(gate).not.toBeNull()
    expect(gate?.[1]).toBe(gate?.[2])
  })

  it('leaves the per-RPC 5xx rate monitors on their clamp_min denominator', () => {
    // A rate's numerator counts bad events, so flooring the denominator does cap one failure.
    for (const { query } of rateMonitors) {
      expect(query).toContain('clamp_min(')
    }
  })

  it('never floors a percentile with clamp_min anywhere in the service', () => {
    const offenders = allMonitors.filter((m) => /p\d\d?[:{]|\.p\d\d?\{/.test(m.query) && m.query.includes('clamp_min('))
    expect(offenders.map((m) => m.id)).toEqual([])
  })

  it('checks that guard against every monitor file', () => {
    // A new monitor file that nobody adds to allMonitors would silently fall outside that guard.
    expect(allMonitors.length).toBeGreaterThanOrEqual(privyEmbeddedWalletEndpointMonitors.length)
    for (const group of [
      privyEmbeddedWalletAvailabilityMonitors,
      privyEmbeddedWalletBusinessMonitors,
      privyEmbeddedWalletDepsMonitors,
      privyEmbeddedWalletEndpointMonitors,
      privyEmbeddedWalletErrorMonitors,
      privyEmbeddedWalletKillSwitchMonitors,
      privyEmbeddedWalletLatencyMonitors,
      privyEmbeddedWalletSecurityMonitors,
    ]) {
      expect(group.every((m) => allMonitors.includes(m))).toBe(true)
    }
  })
})

describe('per-endpoint thresholds sit outside measured prod variance', () => {
  // Gated series over 30 days of prod (2026-09-05..10-05), scored as the monitor scores it: `max`
  // over the window's surviving 30-minute buckets. `baseline` excludes the excursions the
  // criticals exist to catch (2026-09-18 19:00Z service-wide incident; GetRecoveryConfig
  // 2026-09-11 17:30Z; Sign7702Authorization 2026-10-05 17:00Z). `eventPeak` is the excursion's
  // peak, as a check that the critical is reachable.
  const MEASURED = {
    privy_embedded_wallet_challenge_latency_p95: { baseline: { max: 0.5722 }, eventPeak: 10.0488 },
    privy_embedded_wallet_get_recovery_config_latency_p95: { baseline: { max: 0.7334 }, eventPeak: 3.0534 },
    privy_embedded_wallet_list_authenticators_latency_p95: { baseline: { max: 0.1605 } },
    privy_embedded_wallet_wallet_sign_in_latency_p95: { baseline: { max: 0.7448 } },
    privy_embedded_wallet_create_wallet_latency_p95: { baseline: { max: 1.2233 }, eventPeak: 10.0488 },
    privy_embedded_wallet_sign_message_latency_p95: { baseline: { max: 0.4977 } },
    privy_embedded_wallet_sign_transaction_latency_p95: { baseline: { max: 0.5055 }, eventPeak: 10.0488 },
    privy_embedded_wallet_disconnect_latency_p95: { baseline: { max: 0.1177 } },
    privy_embedded_wallet_sign_typed_data_latency_p95: { baseline: { max: 0.365 } },
    privy_embedded_wallet_sign7702_authorization_latency_p95: { baseline: { max: 0.4197 }, eventPeak: 1.8309 },
    privy_embedded_wallet_oprf_evaluate_latency_p95: { baseline: { max: 0.4535 } },
    privy_embedded_wallet_export_seed_phrase_latency_p95: { baseline: { max: 0.7221 }, eventPeak: 10.0488 },
  } as const

  // Endpoints with 7 or fewer buckets at the floor over 30 days: too sparse to calibrate, so they
  // borrow the thresholds of a comparable measured endpoint. Max observed gated p95 shown as a
  // sanity bound.
  const BORROWED = {
    privy_embedded_wallet_prepare_add_authenticator_latency_p95: { from: 'sign_message', observedMax: 0.176 },
    privy_embedded_wallet_add_authenticator_latency_p95: { from: 'sign_message', observedMax: 0.248 },
    privy_embedded_wallet_delete_authenticator_latency_p95: { from: 'sign_message', observedMax: 0.028 },
    privy_embedded_wallet_setup_recovery_latency_p95: { from: 'get_recovery_config', observedMax: 0.322 },
    privy_embedded_wallet_execute_recovery_latency_p95: { from: 'get_recovery_config', observedMax: 0.333 },
    privy_embedded_wallet_delete_recovery_latency_p95: { from: 'get_recovery_config', observedMax: 0 },
    privy_embedded_wallet_report_decryption_result_latency_p95: { from: 'get_recovery_config', observedMax: 0.077 },
    privy_embedded_wallet_export_seed_phrase_with_recovery_latency_p95: {
      from: 'export_seed_phrase',
      observedMax: 0.129,
    },
  } as const

  const byId = (id: string) => latencyMonitors.find((m) => m.id === id)
  const measured = Object.entries(MEASURED).map(([id, m]) => ({
    id,
    thresholds: byId(id)?.thresholds,
    alertBody: byId(id)?.alertBody,
    baseline: m.baseline,
    eventPeak: 'eventPeak' in m ? m.eventPeak : undefined,
  }))
  const borrowed = Object.entries(BORROWED).map(([id, b]) => ({
    id,
    thresholds: byId(id)?.thresholds,
    donor: byId(`privy_embedded_wallet_${b.from}_latency_p95`)?.thresholds,
    observedMax: b.observedMax,
  }))

  it('accounts for every endpoint exactly once', () => {
    const ids = [...Object.keys(MEASURED), ...Object.keys(BORROWED)].sort()
    expect(ids).toEqual(latencyMonitors.map((m) => m.id).sort())
  })

  it.each(measured)('$id warns with real headroom over the baseline maximum', ({ thresholds, baseline }) => {
    expect(thresholds?.warning).toBeGreaterThan(1.15 * baseline.max)
  })

  it.each(measured)('$id pages well clear of baseline', ({ thresholds, baseline }) => {
    expect(thresholds?.critical).toBeGreaterThan(1.5 * baseline.max)
  })

  it.each(measured.filter((c) => c.eventPeak !== undefined))(
    '$id critical is reachable by its measured excursion',
    ({ thresholds, eventPeak }) => {
      expect(thresholds?.critical).toBeLessThan(eventPeak as number)
    },
  )

  it.each(borrowed)(
    '$id uses its donor thresholds and clears its observed maximum',
    ({ thresholds, donor, observedMax }) => {
      expect(thresholds).toEqual(donor)
      expect(thresholds?.warning).toBeGreaterThan(observedMax)
    },
  )

  it.each(latencyMonitors)('$id keeps warning below critical', ({ thresholds }) => {
    expect(thresholds?.warning).toBeLessThan(thresholds?.critical as number)
  })

  it.each(latencyMonitors)(
    '$id names both thresholds, since one body serves warn and alert',
    ({ thresholds, alertBody }) => {
      expect(alertBody).toContain(`warning ${thresholds?.warning}s`)
      expect(alertBody).toContain(`critical ${thresholds?.critical}s`)
    },
  )
})

describe('aggregate thresholds sit outside measured prod variance', () => {
  // Same measurement as above on each aggregate's gated series (30 days of prod,
  // 2026-07-18..08-17); `baseline` excludes the 2026-07-28 22:00Z+ incident.
  const AGGREGATES = {
    privy_embedded_wallet_latency_p95: {
      baseline: { p50: 0.2143, p90: 0.2624, p99: 0.3348, max: 0.4826 },
      eventPeak: 0.847,
    },
    privy_embedded_wallet_apm_p95_aggregate: {
      baseline: { p50: 0.3824, p90: 0.4465, p99: 0.6379, max: 0.7448 },
      eventPeak: 3.1988,
    },
  } as const

  const cases = gatedAggregates.map((m) => ({
    id: m.id,
    thresholds: m.thresholds,
    alertBody: m.alertBody,
    ...AGGREGATES[m.id as keyof typeof AGGREGATES],
  }))

  it('measures every gated aggregate', () => {
    expect(cases).toHaveLength(Object.keys(AGGREGATES).length)
    for (const c of cases) {
      expect(c.baseline).toBeDefined()
    }
  })

  it.each(cases)('$id warns above the observed baseline maximum, not inside it', ({ thresholds, baseline }) => {
    expect(thresholds?.warning).toBeGreaterThan(baseline.max)
  })

  it.each(cases)('$id pages well clear of baseline', ({ thresholds, baseline }) => {
    expect(thresholds?.critical).toBeGreaterThan(1.5 * baseline.max)
  })

  it.each(cases)('$id keeps warning below critical', ({ thresholds }) => {
    expect(thresholds?.warning).toBeLessThan(thresholds?.critical as number)
  })

  it.each(cases)('$id would have reported the 2026-07-28 event at some level', ({ thresholds, eventPeak }) => {
    expect(thresholds?.warning).toBeLessThan(eventPeak)
  })

  it.each(cases)('$id names both thresholds, since one body serves warn and alert', ({ thresholds, alertBody }) => {
    expect(alertBody).toContain(`warning ${thresholds?.warning}s`)
    expect(alertBody).toContain(`critical ${thresholds?.critical}s`)
  })
})

describe('minFailuresToAlert', () => {
  it('is what a floored denominator actually guarantees', () => {
    expect(minFailuresToAlert(5, rateDenominatorFloor(5, 20))).toBe(2)
    expect(minFailuresToAlert(2, rateDenominatorFloor(2, 20))).toBe(2)
    expect(minFailuresToAlert(10, rateDenominatorFloor(10, 20))).toBe(3)
  })

  it('is never 1, so no rate monitor can page on a single failure', () => {
    for (const pct of [1, 2, 5, 10, 20, 50]) {
      expect(minFailuresToAlert(pct, rateDenominatorFloor(pct, 20))).toBeGreaterThan(1)
    }
  })
})

describe('alert copy tracks the constants', () => {
  it.each([...rateMonitors, ...privyEmbeddedWalletBusinessMonitors, ...privyEmbeddedWalletDepsMonitors])(
    '$id quotes a failure count, not a request minimum',
    ({ alertBody }) => {
      expect(alertBody).not.toMatch(/Requires at least \d+ requests/)
    },
  )

  it.each(gatedMonitors)('$id names the window and rollup from the constants', ({ alertBody }) => {
    expect(alertBody).toContain(LATENCY_ROLLUP_ADJECTIVE)
    expect(alertBody).toContain(LATENCY_WINDOW_LABEL)
  })

  it.each(gatedDeps)('$id names the dependency window and rollup from the constants', ({ alertBody }) => {
    expect(alertBody).toContain(DEP_LATENCY_ROLLUP_ADJECTIVE)
    expect(alertBody).toContain(DEP_LATENCY_WINDOW_LABEL)
  })

  it.each(allGatedMonitors)('$id claims no more than the floor supports', ({ alertBody }) => {
    expect(alertBody).not.toMatch(/sustained/i)
  })

  it.each(allGatedMonitors)('$id does not claim the floor excludes more than one request', ({ alertBody }) => {
    expect(alertBody).not.toMatch(/no longer the slowest request/i)
  })

  it('derives the window strings from the numeric constants', () => {
    expect(LATENCY_ROLLUP_SECONDS).toBe(1800)
    expect(LATENCY_ROLLUP_LABEL).toBe('30 minutes')
    expect(LATENCY_ROLLUP_ADJECTIVE).toBe('30-minute')
    expect(LATENCY_WINDOW).toBe('last_1h')
    expect(LATENCY_WINDOW_LABEL).toBe('1 hour')
    expect(DEP_LATENCY_ROLLUP_SECONDS).toBe(300)
    expect(DEP_LATENCY_ROLLUP_ADJECTIVE).toBe('5-minute')
    expect(DEP_LATENCY_WINDOW).toBe('last_10m')
    expect(DEP_LATENCY_WINDOW_LABEL).toBe('10 minutes')
  })
})

describe('volumeGatedPercentile', () => {
  const hits = 'count:m{f}'

  it('rolls up both terms and gates on the rolled-up count', () => {
    expect(volumeGatedPercentile('p95:m{f}', { hits, floor: 20 })).toBe(
      `( p95:m{f}.rollup(avg, ${LATENCY_ROLLUP_SECONDS}) * ${hits}.rollup(sum, ${LATENCY_ROLLUP_SECONDS})` +
        ` / cutoff_min(${hits}.rollup(sum, ${LATENCY_ROLLUP_SECONDS}), 20) )`,
    )
  })

  it('honours a caller-supplied rollup for monitors on another cadence', () => {
    expect(volumeGatedPercentile('p95:m{f}', { hits, floor: 3, rollupSeconds: 300 })).toBe(
      `( p95:m{f}.rollup(avg, 300) * ${hits}.rollup(sum, 300) / cutoff_min(${hits}.rollup(sum, 300), 3) )`,
    )
  })
})
