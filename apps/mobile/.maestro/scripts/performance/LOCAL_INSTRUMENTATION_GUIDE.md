# Maestro E2E Performance Instrumentation Guide

## Overview

We've instrumented our Maestro E2E tests to collect performance metrics across three runtime environments: local development, DeviceCloud (CI), and Maestro Cloud. This comprehensive instrumentation enables us to track test execution times, identify performance regressions, and monitor the health of our test suite across all deployment scenarios.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MAESTRO E2E TEST EXECUTION                         │
│                  (Local / DeviceCloud / Maestro Cloud)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INSTRUMENTED TEST FLOWS                             │
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐      │
│  │ init-tracking.js│───▶│ start-flow.js    │───▶│ track-action.js    │      │
│  │ (init buffer)  │    │ (flow_start)     │    │ (action metrics)   │      │
│  └─────────────────┘    └──────────────────┘    └────────────────────┘      │
│           │                                               │                 │
│           │              ┌──────────────────┐             │                 │
│           └─────────────▶│ start-sub-flow.js│◀────────────┘                 │
│                          │ (shared flows)   │                               │
│                          └──────────────────┘                               │
│                                    │                                        │
│                          ┌──────────────────┐                               │
│                          │ end-sub-flow.js  │                               │
│                          └──────────────────┘                               │
│                                    │                                        │
│                          ┌──────────────────┐                               │
│                          │ end-flow.js      │                               │
│                          │ (flow_end)       │                               │
│                          └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                 │
         LOCAL/DEVICECLOUD                    MAESTRO CLOUD
                     │                                 │
                     ▼                                 ▼
┌────────────────────────────────┐   ┌────────────────────────────────────┐
│      CONSOLE OUTPUT            │   │    IN-MEMORY BUFFER                │
│                                │   │                                    │
│ MAESTRO_METRIC:{...}           │   │ output.METRICS_BUFFER = [          │
│ MAESTRO_METRIC:{...}           │   │   {"type":"flow",...},             │
│                                │   │   {"type":"action",...}            │
│                                │   │ ]                                  │
└────────────────────────────────┘   └────────────────────────────────────┘
                     │                                 │
                     ▼                                 ▼
┌────────────────────────────────┐   ┌────────────────────────────────────┐
│   EXTRACT & PROCESS            │   │    DIRECT UPLOAD                   │
│                                │   │                                    │
│ - extract-metrics.sh           │   │ - upload-metrics.js                │
│ - process-metrics.ts           │   │ - HTTP POST to Datadog            │
│ - submit-metrics.js            │   │ - Per-flow execution               │
└────────────────────────────────┘   └────────────────────────────────────┘
                     │                                 │
                     └────────────────┬────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────┐
                         │   DATADOG METRICS   │
                         │                     │
                         │ Tagged by:          │
                         │ - Environment       │
                         │ - Flow name         │
                         │ - Platform          │
                         │ - CI metadata       │
                         └─────────────────────┘
```

## Quick Start

### Running Tests with Metrics

#### Local Development

```bash
# Run all e2e tests or a specific test
yarn e2e:interactive

# Process and submit metrics
export DATADOG_API_KEY=your-key-here
yarn e2e:local:process-metrics
```

#### Maestro Cloud

```bash
# Flows automatically upload metrics when DATADOG_API_KEY is provided
maestro cloud --api-key $MAESTRO_CLOUD_KEY \
  -e DATADOG_API_KEY=$DATADOG_API_KEY \
  apps/mobile/.maestro/flows/swap/swap-base.yaml
```

### How It Works

#### Local/DeviceCloud

1. **Test Execution**: Maestro runs instrumented test flows
2. **Metric Logging**: Scripts log metrics with `MAESTRO_METRIC:` prefix
3. **Extraction**: Shell script extracts metrics from Maestro logs
4. **Processing**: JavaScript adds synthetic events for failed flows
5. **Submission**: Metrics are sent to Datadog via HTTP API

#### Maestro Cloud

1. **Test Execution**: Maestro runs instrumented test flows
2. **Metric Collection**: Scripts append metrics to `output.METRICS_BUFFER`
3. **Direct Upload**: `upload-metrics.js` sends buffer contents to Datadog
4. **Per-Flow Submission**: Each flow uploads its own metrics at completion

## Instrumentation Example

```yaml
# swap-base.yaml
appId: com.uniswap.mobile.dev

# Initialize tracking
- runScript:
    file: .maestro/scripts/performance/dist/actions/init-tracking.js
- runScript:
    file: .maestro/scripts/performance/dist/actions/start-flow.js
    env:
      FLOW_NAME: swap-base

# Track shared flow (automatically tracked internally)
- runFlow: ../shared/start.yaml

# Track individual action
- runScript:
    file: .maestro/scripts/performance/dist/actions/track-action.js
    env:
      ACTION: tap
      TARGET: swap-button
      PHASE: start
- tapOn:
    id: "swap-button"
- runScript:
    file: .maestro/scripts/performance/dist/actions/track-action.js
    env:
      ACTION: tap
      TARGET: swap-button
      PHASE: end

# End flow tracking
- runScript:
    file: .maestro/scripts/performance/dist/actions/end-flow.js

# Upload metrics to Datadog (for Maestro Cloud)
- runScript:
    file: .maestro/scripts/performance/upload-metrics.js
    env:
      DATADOG_API_KEY: ${DATADOG_API_KEY}
      ENVIRONMENT: 'maestro_cloud'
```

## Metrics Collected

### Flow Metrics

- **Metric**: `maestro.e2e.flow.duration`
- **Purpose**: Total test execution time
- **Tags**: `flow_name`, `platform`, `status`

### Action Metrics

- **Metric**: `maestro.e2e.action.duration`
- **Purpose**: Individual UI action timing
- **Tags**: `action_type`, `action_target`, `step_number`

### Sub-Flow Metrics

- **Metric**: `maestro.e2e.sub_flow.duration`
- **Purpose**: Shared component performance
- **Tags**: `parent_flow_name`, `sub_flow_name`

## Best Practices

### DO ✅

- Initialize tracking at the start of every flow
- Track meaningful user actions (taps, inputs, swipes)
- Let shared flows track themselves internally
- Use descriptive action targets
- Clear logs regularly with `yarn e2e:clear-logs`

### DON'T ❌

- Double-track shared flows (they track themselves)
- Track every minor interaction
- Forget to end flow tracking
- Mix local and CI metrics without proper tags

### Shared Flow Example

**Correct Implementation:**

```yaml
# Shared flow tracks itself internally
- runFlow: ../../shared-flows/biometrics-confirm.yaml
```

**Incorrect (creates duplicate metrics):**

```yaml
# Don't wrap with track-action
- runScript:
    file: track-action.js
    env:
      ACTION: 'runFlow'
      PHASE: 'start'
- runFlow: ../../shared-flows/biometrics-confirm.yaml
- runScript:
    file: track-action.js
    env:
      ACTION: 'runFlow'
      PHASE: 'end'
```

## Design Rationale

### Why Instrument E2E Tests Instead of Application Code?

We chose to instrument the E2E test files themselves rather than the application code for several key reasons:

#### 1. **Non-Invasive Testing**

- **Zero production impact**: No performance overhead in the actual app
- **No code pollution**: Production code remains clean and focused on functionality
- **Risk-free**: Can't accidentally ship instrumentation code to users

#### 2. **Test-Specific Insights**

- **User journey timing**: Measures real user workflows, not individual render cycles
- **Interaction-based**: Tracks actual tap-to-response times as users experience them
- **Flow-level metrics**: Provides holistic view of feature performance

#### 3. **Practical Constraints**

- **Maestro limitations**: Can only execute scripts between test actions
- **No runtime access**: Cannot inject code into the running React Native app
- **Platform agnostic**: Works identically on iOS and Android simulators

### Alternative Approaches Considered

#### ❌ **React Native Performance API**

```javascript
// Would require modifying app code
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    // Send metrics...
  });
});
```

**Why not**: Requires production code changes, only captures render performance, not user workflows

#### ❌ **Native Performance Monitoring**

```swift
// iOS: Using Instruments API
// Android: Using System Trace
```

**Why not**: Platform-specific, requires native code changes, complex integration with E2E tests

#### ❌ **Maestro Built-in Metrics**

```yaml
# Maestro's native timing (if it existed)
- tapOn:
    id: button
    recordMetrics: true
```

**Why not**: Maestro doesn't provide built-in performance tracking or metric export

#### ❌ **Video Analysis**

- Record test execution
- Analyze frame-by-frame for timing
- Extract metrics from visual changes

**Why not**: Computationally expensive, less accurate, requires additional infrastructure

#### ❌ **Network Proxy Instrumentation**

- Intercept API calls during tests
- Measure request/response times
- Correlate with user actions

**Why not**: Only captures network performance, misses UI responsiveness

### Current Approach Benefits

1. **Separation of Concerns**
   - Tests measure performance
   - App code focuses on features
   - Metrics are test artifacts, not production data

2. **Flexibility**
   - Easy to add/remove tracking without touching app code
   - Can track any Maestro-supported action
   - Simple to customize metrics per test flow

3. **Reliability**
   - Consistent measurement approach
   - No dependency on app internals
   - Works with any React Native version

4. **Developer Experience**
   - No special builds required
   - Same app binary for all tests
   - Easy to understand and debug

## Technical Details

### GraalJS Compatibility

All tracking scripts are ES2020-compatible for Maestro's GraalJS runtime:

- Supports ES2020 features (async/await, optional chaining, etc.)
- Use `output` object for data persistence (especially for Maestro Cloud)
- Environment variables passed directly (not via `process.env`)
- HTTP requests use Maestro's `http` API (not XMLHttpRequest)

### Environment Detection

Scripts automatically detect the runtime environment:

```javascript
// In action scripts
if (typeof output !== 'undefined' && output.METRICS_BUFFER !== undefined) {
  // Maestro Cloud mode - append to buffer
  let buffer = JSON.parse(output.METRICS_BUFFER || '[]');
  buffer.push(metric);
  output.METRICS_BUFFER = JSON.stringify(buffer);
}
// Always log to console for backward compatibility
console.log('MAESTRO_METRIC:' + JSON.stringify(metric));
```

### Synthetic Events

Failed flows automatically receive synthetic `flow_end` events during processing to ensure complete metrics even when tests fail. This happens in:

- `process-metrics.ts` (compiled to JS) for DeviceCloud/local environments

- Not needed for Maestro Cloud as flows handle their own completion
