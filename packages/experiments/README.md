# @universe/experiments

Correlation transport for the `x-experiments` header — the cable that lets the frontend
and backend agree on the same experiment bucket so metrics attribute together.

This package is **not** an experiment-evaluation layer. Experiments are still defined and
evaluated in Statsig via [`@universe/gating`](../gating). This package only carries an
already-decided bucket across the wire, for the small slice of experiments that span both
the frontend and the backend.

## When you need it

| Experiment shape | Example | Use this package? |
| --- | --- | --- |
| FE-only | Swap button color | No — just `useExperimentValue` from gating |
| BE-only | Which routing algorithm to quote with | No |
| **Coordinated** | FE shows a variant *and* the quote must price for it, attributed as one experiment | **Yes** |

The header is plumbing — feature code never touches `x-experiments`, JSON, or parsing.
You interact with experiments; the client handles transport.

## The wire contract

The header value is a JSON object keyed by experiment name, matching the backend verbatim:

```jsonc
{
  "checkout_flow_v2": {
    "groupName": "treatment",          // optional; absent ⇒ null
    "value": { "buttonColor": "green" } // the group's parameter map
  }
}
```

`EXPERIMENTS_HEADER_NAME`, `parseExperimentsHeader`, and `serializeExperimentsHeader` are
the only code anywhere that knows this shape. If the backend contract changes, `src/codec.ts`
and `src/types.ts` are the single place to change.

## Core client

```ts
import { getExperimentsClient } from '@universe/experiments'

const experiments = getExperimentsClient()

experiments.set('checkout_flow_v2', { groupName: 'treatment', value: { buttonColor: 'green' } })
experiments.toHeaders() // → { 'x-experiments': '{"checkout_flow_v2":{...}}' }  (write, FE→BE)
experiments.absorb(response) // merges experiments off a response (read, BE→FE)
experiments.clear() // reset on logout
```

`getExperimentsClient()` is the process-wide shared instance — both the fetch client and the
React hooks default to it, so a contributed experiment rides along on requests automatically.
Use `createExperimentsClient()` for isolated instances (tests, advanced wiring).

### Write semantics & the collision alarm

Writes are **first-write-wins**: re-writing the same value is a no-op, but writing a
*different* value for an experiment already in the set fires `onCollision` and keeps the
original (a user's bucket must not change mid-flow). Wire the alarm once at app startup:

```ts
import { configureExperiments } from '@universe/experiments'

configureExperiments({
  onCollision: ({ name, existing, incoming }) =>
    analytics.track('experiment_collision', { name, existing, incoming }),
})
```

When unconfigured it falls back to a logged warning.

## React bindings & the gating bridge

`useExperiment`, `ExperimentsProvider`, and the propagation hook
(`useExperimentValue({ propagate: true })`) are layered on top of this core — see the hooks
exported from the package root.
