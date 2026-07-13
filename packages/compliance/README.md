# @universe/compliance

Client wrapper over `@uniswap/client-compliancev2`. Reads a token's deny-list status (and records per-token acknowledgements) from the compliance v2 `featureGatedTokens` endpoint via Entry Gateway, and reads which product features are geo-blocked for the caller's region from `gatedFeatures`. Powers the swap geo-restriction surface.

## Install

Workspace package. Add it to your app/package `dependencies`:

```jsonc
"@universe/compliance": "workspace:^"
```

Import everything from the package root — deep imports are lint-blocked.

## Setup

Mount `ComplianceClientProvider` once, near the React Query root. It is already mounted in `SharedWalletProvider` (mobile/extension) and `apps/web/src/index.tsx` (web), so most consumers need no setup. `useComplianceClient` / `useTokenComplianceStatus` throw without an ancestor provider.

```tsx
import { ComplianceClientProvider } from '@universe/compliance'

<ComplianceClientProvider>
  <App />
</ComplianceClientProvider>
```

## Read token status

```tsx
import { useTokenComplianceStatus, isHardBlocked, isAckGated } from '@universe/compliance'

const { reasons, isLoading } = useTokenComplianceStatus({ chainId, address })

if (isHardBlocked(reasons)) {
  // region hard block — no user action clears it
} else if (isAckGated(reasons)) {
  // show the acknowledgement card/modal
}
```

`reasons` is empty when the token is clean or the call hasn't resolved. Classify it with the `reasons.ts` helpers (`isHardBlocked`, `requiresAcknowledgement`, `isAcknowledged`, `isAckGated`, `hasUnrecognizedReason`) rather than comparing `RestrictionReason` values directly — hard-block and acknowledgement reasons never co-occur on one token.

## Acknowledge a token (write)

```tsx
import { useSetTokenAcknowledgement } from '@universe/compliance'

const { acknowledgeToken, isPending } = useSetTokenAcknowledgement()

await acknowledgeToken({ chainId, address }) // only valid while REQUIRES_ACKNOWLEDGEMENT
```

On success it invalidates the token's status query, so the next `useTokenComplianceStatus` read flips `REQUIRES_ACKNOWLEDGEMENT` → `ACKNOWLEDGED`.

## Check geo-blocked features (region-level)

Separate from the per-token surface above: `gatedFeatures` answers "is product feature X geo-blocked for my region?". The region is resolved server-side from the Entry Gateway request context — no region input is sent.

```tsx
import { useIsFeatureGated, GatedFeature } from '@universe/compliance'

const isRwaRegionBlocked = useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
```

```tsx
import { useGatedFeatures, GatedFeature } from '@universe/compliance'

const { features, isLoading } = useGatedFeatures() // GatedFeature[] blocked for this region
```

`GatedFeature` values today: `TOKEN_LAUNCHER`, `ISSUER_SPECIFIC_RWA`. The feature check is region-level only — it does **not** know whether a given token is an RWA, so pair it with your own token check (e.g. `regionBlocked && tokenIsRwa`); checking the feature alone would gate every token for users in a blocked region.

`useGatedFeatures` runs one no-arg query under a single cache key (region is the same for every feature), so `useIsFeatureGated` is free to call per feature. Both fail open: empty/`false` while loading and for unauthenticated callers — never read empty as "verified not gated".

## Testing

Pass a stub `client` to `ComplianceClientProvider`, or build one with `createComplianceV2Client(transport)`.

See [`CLAUDE.md`](./CLAUDE.md) for conventions, the platform transport, and gotchas.
