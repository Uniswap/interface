# Dev Portal Instrumentation Report

> Updated: 2026-02-25

## Executive Summary

The dev-portal has **strong application-level logging** in code but **zero logs flowing to Datadog** and **no APM traces**. The structured JSON logging infrastructure exists in the app (wide events, DD correlation fields, PII scrubbing) but the DD Agent sidecar is not configured to forward container logs. ALB metrics (request count, latency percentiles, HTTP status codes) are available via the AWS integration and are now used for the 6 infrastructure monitors.

## Key Finding: Log Collection Gap

**Container stdout logs are NOT reaching Datadog.** Investigation via the Datadog API confirmed:

- `service:dev-portal` returns **zero logs** across all indexes (searched 7 days)
- `ecs_cluster:dev-portal-ecs` returns **zero logs**
- Host tags confirm **DD Agent is running** on ECS instances (apps: agent, docker, container, ntp)
- The DD Agent trace agent is running but receiving **zero spans**
- Container/docker metrics are reported for the hosts

**Root cause:** The DD Agent sidecar likely needs log collection enabled for the dev-portal container. The app writes structured JSON to stdout, but the agent isn't configured to collect container logs (no `DD_LOGS_ENABLED=true` or `com.datadoghq.ad.logs` Docker labels found).

## Available Data Sources

### What EXISTS in Datadog

| Source | Data Available | Tag Filter |
|---|---|---|
| ALB metrics | request_count, target_response_time (p50/p90/p95/p99), httpcode_target_2xx/3xx/4xx/5xx, healthy_host_count | `name:dev-portal-lb,unienv:prod` |
| EC2/ECS host metrics | cpu, memory, network, disk | `ecs_cluster:dev-portal-ecs` |
| Container metrics | cpu, memory, network, uptime, thread count | `host:i-*` (dev-portal hosts) |
| DD Agent telemetry | trace_agent.heartbeat, stats_writer.*, trace_writer.* | `host:i-*` |

### What DOES NOT exist in Datadog

| Source | Why |
|---|---|
| APM traces (`trace.web.request`) | `dd-trace` incompatible with Bun runtime, no OTEL configured |
| Application logs (`service:dev-portal`) | DD Agent log collection not enabled for container |
| RUM data | No browser SDK |
| Synthetic checks | Not configured |

## Current Instrumentation Inventory

### Server-Side (Hono + Bun)

| Signal | Instrumented? | Where | Reaching DD? |
|---|---|---|---|
| Request lifecycle (method, path, status, duration) | **Yes** | `server.ts` wide event → `request.complete` log | **No** — logs not collected |
| tRPC procedure spans (name, duration, outcome) | **Yes** | `wideEvent.addProcedure()` in tRPC middleware | **No** — logs not collected |
| Entry Gateway proxy (url, status, duration) | **Yes** | `proxy.ts` → `gateway.proxy.complete` / `gateway.proxy.error` | **No** — logs not collected |
| Auth flow events (initiate, verify, conflict, mismatch) | **Yes** | `server.ts` tRPC routers → structured log messages | **No** — logs not collected |
| Error logging with stack traces | **Yes** | `structuredJsonLogger.ts` → `level:error` | **No** — logs not collected |
| PII scrubbing | **Yes** | `scrub.ts` — redacts tokens, emails, secrets | N/A |
| DD trace/span correlation IDs | **Yes** | `structuredJsonLogger.ts` → `dd.trace_id`, `dd.span_id`, `dd.service` | **No** — logs not collected |
| Traffic classification (human/crawler/ai-tool) | **Yes** | `ai-traffic.ts` → `traffic_type`, `traffic_agent` on wide event | **No** — logs not collected |
| Amplitude analytics (server-side) | **Yes** | `service.ts` → Amplitude Node SDK | N/A (separate system) |

### Client-Side (React Router v7 SSR)

| Signal | Instrumented? | Where | Reaching DD? |
|---|---|---|---|
| Chunk load error recovery | **Yes** | `entry.client.tsx` → auto-reload on chunk failure | No |
| Hydration errors | **Yes** | `entry.client.tsx` → `consoleLoggerFactory` | No |
| Route error tracking | **Yes** | `root.tsx` ErrorBoundary → `trackError()` via tRPC | No |
| Page views | **Yes** | `usePageView()` hook → Amplitude | N/A |
| Core Web Vitals | **No** | — | — |
| JS error tracking | **No** | — | — |

### Infrastructure

| Signal | Available? | Where | Reaching DD? |
|---|---|---|---|
| ALB request metrics | **Yes** | AWS integration → `aws.applicationelb.*` | **Yes** |
| ALB latency percentiles | **Yes** | AWS integration → `target_response_time.p95/p99` | **Yes** |
| ALB HTTP status codes | **Yes** | AWS integration → `httpcode_target_2xx/5xx` | **Yes** |
| ECS host health | **Yes** | DD Agent → `system.*` | **Yes** |
| Container metrics | **Yes** | DD Agent → `container.*`, `docker.*` | **Yes** |
| ECS task health | **Yes** | Docker HEALTHCHECK → `/health` every 30s | **Yes** |
| Container stdout logs | **Yes** in container | Structured JSON → stdout | **No** — not forwarded to DD |
| Datadog APM traces | **No** | `dd-trace` not compatible with Bun runtime | No |
| Datadog RUM | **No** | No browser SDK | No |

## Monitor Coverage Matrix

### Infrastructure Monitors (6 — ALB-based)

| Monitor | Type | Signal Source | Query | Status |
|---|---|---|---|---|
| P95 Latency | query alert | `aws.applicationelb.target_response_time.p95` | `avg(last_5m) > 2s` | **Active** |
| P99 Latency | query alert | `aws.applicationelb.target_response_time.p99` | `avg(last_5m) > 5s` | **Active** |
| 5xx Error Rate | query alert | `httpcode_target_5xx / request_count` | `sum(last_5m) > 5%` | **Active** |
| Error Count Anomaly | query alert | `httpcode_target_5xx` anomaly | agile, 3 deviations | **Active** |
| Zero Traffic | query alert | `aws.applicationelb.request_count` | `sum(last_10m) == 0` | **Active** |
| Success Rate | query alert | `1 - (5xx / request_count)` | `< 99%` | **Active** |

### Application Monitors (5 — Log-based, BLOCKED)

| Monitor | Type | Signal Source | Query | Status |
|---|---|---|---|---|
| Auth Failure Rate | log alert | `service:dev-portal` logs | `auth*failed OR session*failed > 20/15m` | **No Data** — logs not collected |
| Session Conflict Spike | log alert | `service:dev-portal` logs | `message:*conflict > 10/15m` | **No Data** — logs not collected |
| Gateway Proxy Errors | log alert | `service:dev-portal` logs | `gateway.proxy.error > 5/10m` | **No Data** — logs not collected |
| Gateway Proxy High Latency | log alert | `service:dev-portal` logs | `duration_ms > 3000, count > 10/10m` | **No Data** — logs not collected |
| Error Log Spike | log alert | `service:dev-portal` logs | `level:error > 50/15m` | **No Data** — logs not collected |

All 5 log monitors have `onMissingData: show_no_data` so they correctly report "No Data" instead of false "OK".

## Gap Analysis

### Critical Gaps (P0)

#### 1. Container Log Collection Not Enabled
**Problem:** The DD Agent sidecar runs on dev-portal ECS hosts but is not collecting container logs. All structured JSON logging in the app (wide events, auth events, gateway events, errors) writes to stdout but never reaches Datadog.

**Impact:** 5 log-based monitors are non-functional. No application-level visibility in Datadog.

**Recommendation:** Enable log collection on the DD Agent:
- Set `DD_LOGS_ENABLED=true` on the DD Agent sidecar container
- Add `DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true` or configure Docker labels (`com.datadoghq.ad.logs`) on the dev-portal container
- Ensure the DD Agent has `logs_enabled: true` in its config
- The app already writes DD-compatible structured JSON with correlation fields — no app changes needed

#### 2. Dev-portal Team EP is Placeholder
**Problem:** The `dev-portal` entry in `shared-infra/incident` ESC uses SRE's EP (`01K4XB5BT0SZY16A4J6Z20WXD8`) and Slack (`@slack-sre-alerts`) as placeholders.

**Recommendation:** Create a dedicated dev-portal EP in incident.io and Slack channel, then update the ESC.

### High Gaps (P1)

#### 3. Runtime Uncertainty: Bun vs Node.js
**Problem:** The Dockerfile shows `CMD ["bun", "run", ...]` and `--target=bun`, but the actual ECS task definition may differ. If the production runtime is Node.js, `dd-trace` APM could be enabled.

**Recommendation:** Verify the actual production runtime in the ECS task definition. If Node.js, enable `dd-trace` for full APM. If Bun, investigate OTEL support.

#### 4. No Client-Side Error Visibility
**Problem:** JS errors, hydration failures, and chunk load errors are only logged to browser console.

**Recommendation (Phase 2):** Add Datadog RUM SDK to `entry.client.tsx`.

#### 5. No Synthetic Monitoring
**Problem:** No automated uptime checks beyond Docker HEALTHCHECK (container-local only).

**Recommendation (Phase 2):** Create Datadog Synthetics for `/health`, `/docs`, `/dashboard`.

### Medium Gaps (P2)

#### 6. API Key Scope Limits Debugging
**Problem:** The DD app key in `shared-infra/datadog-2026` ESC is scoped and cannot query the metrics API (returns 404). This limits ability to validate monitor queries programmatically.

**Recommendation:** Either request broader app key scope, or validate queries through the Datadog UI instead of API.

#### 7. tRPC Procedure-Level Metrics Not Extractable
**Problem:** The wide event `procedures` array with per-procedure timing is nested JSON — hard to create per-procedure metrics.

**Recommendation:** Log individual procedure spans as separate log lines (once log collection is enabled).

#### 8. AI Traffic Not in Datadog
**Problem:** AI traffic classification tracked in Amplitude but not visible in DD dashboards.

**Recommendation:** Once logs flow, the `traffic_type` and `traffic_agent` fields are queryable in DD Log Analytics.

### Low Gaps (P3)

#### 9. Amplitude Parallel Universe
**Problem:** Full Amplitude analytics integration (auth, page views, API keys, AI traffic, feedback) creates split-brain observability.

**Recommendation:** Long-term, decide if Amplitude events should mirror to DD custom metrics.

#### 10. No Deployment Tracking
**Problem:** No deployment events sent to Datadog.

**Recommendation:** Add `datadog.ServiceDefinition` and emit deployment events from CI/CD.

## Recommended Phased Roadmap

### Phase 1: Log Collection (CRITICAL — Next Sprint)
- [ ] Enable DD Agent log collection for dev-portal ECS containers
- [ ] Verify logs appear in Datadog with `service:dev-portal`
- [ ] Confirm 5 log-based monitors transition from "No Data" to active
- [x] Register `dev-portal` team in `shared-infra/incident` ESC (placeholder)
- [ ] Replace placeholder EP/Slack with dev-portal team's actual values

### Phase 2: APM Resolution
- [ ] Verify Bun vs Node.js runtime in production ECS task definition
- [ ] If Node.js: enable `dd-trace` for full APM
- [ ] If Bun: investigate OTEL/OpenTelemetry support in Bun
- [ ] Add dashboard rows for auth, gateway, infra, AI traffic

### Phase 3: Client-Side (Future)
- [ ] Add Datadog RUM SDK
- [ ] Create synthetic monitors
- [ ] Set up deployment tracking

### Phase 4: Advanced (Future)
- [ ] SLOs based on error budget
- [ ] Anomaly detection on tRPC procedures
- [ ] Composite monitors for cascading failures
- [ ] Integration with Amplitude for unified dashboards

## Monitor Inventory (Current State)

| # | Monitor | Category | Type | Signal | Priority | Status |
|---|---|---|---|---|---|---|
| 1 | P95 Latency | latency | query alert | ALB `target_response_time.p95` | P3 | Active |
| 2 | P99 Latency | latency | query alert | ALB `target_response_time.p99` | P2 | Active |
| 3 | 5xx Error Rate | errors | query alert | ALB `httpcode_target_5xx` | P2 | Active |
| 4 | Error Count Anomaly | errors | query alert | ALB `httpcode_target_5xx` | P3 | Active |
| 5 | Zero Traffic | availability | query alert | ALB `request_count` | P1 | Active |
| 6 | Success Rate | availability | query alert | ALB `httpcode_target_5xx/request_count` | P2 | Active |
| 7 | Auth Failure Rate | auth | log alert | `service:dev-portal` logs | P3 | No Data |
| 8 | Session Conflict Spike | auth | log alert | `service:dev-portal` logs | P3 | No Data |
| 9 | Gateway Proxy Errors | gateway | log alert | `service:dev-portal` logs | P2 | No Data |
| 10 | Gateway Proxy High Latency | gateway | log alert | `service:dev-portal` logs | P3 | No Data |
| 11 | Error Log Spike | logs | log alert | `service:dev-portal` logs | P2 | No Data |

**Total: 11 monitors** (6 ALB-based active, 5 log-based awaiting log collection)

**Paging/Slack: disabled** for initial rollout (`disablePaging: true`, `disableSlack: true` in ESC and stack config).
