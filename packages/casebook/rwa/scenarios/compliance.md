# RWA scenarios — Geogating, permissioned tokens & compliance

Region gating for tokenized assets (geogated RWA assets must be un-tradable from
restricted regions, and the RWA TDP must not expose actionable trade CTAs to a
geoblocked user) plus the permissioned-token (KYC allowlist) gating for swaps and
sends. Failure here is a compliance/prod-incident risk. Shared defaults: `_defaults.yaml`.

Wallet alias used below (no secrets; the real mnemonic lives in the QA vault keyed by
the same alias): `TW-RWA-01` = funded wallet holding a tradable RWA/stock token and a
stablecoin on Ethereum mainnet. The alias is region-neutral; each case's Given states
the region the session must run from.

---
id: rwa-geogating-swap-blocked-restricted-region
title: Geogated RWA assets cannot be swapped from a restricted region
# importance
priority: urgent
severity: urgent
# provenance
source: uniswap
sourceNote: "Derived from the ISSUER_SPECIFIC_RWA compliance gate (packages/compliance, read via useIsFeatureGated) and the permissionedTokens gating code; the former rwa_geo_blocked flag was removed in #41845. A Testlio case titled 'Geogating' was previously cited here but could not be verified against the blueprint's declared Testlio titles or filter (Features={Tokenized Assets} OR /tokenized asset|stocks section/i), so the ref was removed; if a real Testlio geogating case exists outside that filter, re-add it verbatim and widen the blueprint filter."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - compliance
  - geogating
wallets:
  - TW-RWA-01
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/
  - packages/uniswap/src/features/rwa/useIsRWAToken.ts
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** the session runs from a restricted region (e.g. the U.S.) and an RWA asset on the geogated list is selected in the swap flow
**When** the user attempts to swap that geogated asset
**Then** the swap is blocked: the user receives a georestriction error or is otherwise prevented from proceeding (no submittable transaction)
**And** the same asset, when accessed from a non-restricted region with `TW-RWA-01` connected, can be swapped successfully through the normal flow

---
id: rwa-tdp-geoblocked-cta-hidden
title: RWA TDP hides actionable trade CTAs for a geoblocked user
# importance
priority: urgent
severity: high
# provenance
source: testlio
sourceNote: "Blueprint Testlio suite 'Tokenized Assets - TDP Page'. The ISSUER_SPECIFIC_RWA compliance gate is read in packages/uniswap/src/features/rwa/useLogRWATokenDetailsViewed.ts (analytics side is unit-covered there); the CTA-hiding UX itself has no e2e automation, so this case renders as a gap."
testlioRef: Tokenized Assets - TDP Page
# scope
chains:
  - ethereum
platforms:
  - web
  - mobile
labels:
  - regression
  - rwa
  - compliance
  - geogating
  - tdp
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/rwa/useLogRWATokenDetailsViewed.ts
  - packages/uniswap/src/features/permissionedTokens/
  - apps/web/src/pages/TokenDetails/components/rwa/
  - apps/mobile/src/components/TokenDetails/rwa/
automationRefs: []
---

> **urgent · e2e · release · gap** · chains: ethereum

**Given** the ISSUER_SPECIFIC_RWA compliance gate applies to the tester's region and the user opens an RWA asset's TDP
**When** the page renders for the geoblocked user
**Then** the TDP does not expose an actionable Get / Buy / Swap CTA that would let the blocked user start trading, and the blocked UX aligns with the existing swap georestriction messaging
**And** in a non-blocked region the same RWA TDP still allows the normal trade entry flow

---
id: rwa-permissioned-swap-pair-gating
title: Permissioned (KYC-gated) RWA pair resolves allowlist state before swap
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/permissionedTokens/usePermissionedSwapPair.test.ts and useTokenKYCStatus.test.ts (all cited test names verified verbatim)."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - compliance
  - permissioned
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/usePermissionedSwapPair.ts
  - packages/uniswap/src/features/permissionedTokens/useTokenKYCStatus.ts
automationRefs:
  - path: packages/uniswap/src/features/permissionedTokens/usePermissionedSwapPair.test.ts
    testName: usePermissionedSwapPair > request shape > sends lowercased addresses and the wallet to the API
  - path: packages/uniswap/src/features/permissionedTokens/usePermissionedSwapPair.test.ts
    testName: usePermissionedSwapPair > empty/loading/error > fails open when the API errors (queryFn handles logging)
  - path: packages/uniswap/src/features/permissionedTokens/useTokenKYCStatus.test.ts
    testName: useTokenKYCStatus > reports isAllowlisted=false with kycUrl when API marks the wallet as not allowlisted
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a swap pair where a permissioned (KYC-gated) tokenized asset is one side
**When** `usePermissionedSwapPair` / `useTokenKYCStatus` query the permissioned-token API with the connected wallet
**Then** the request sends lowercased token addresses plus the wallet, and reports `isPermissioned` / `isAllowlisted` with a `kycUrl` when the wallet is not allowlisted
**And** it fails open (does not spuriously block) when the API is loading, empty, on a cross-chain pair, or errors

---
id: rwa-permissioned-send-blocking
title: Sending a permissioned token is blocked by the sender/recipient allowlist
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts (10 tests; cited names verified verbatim). Added per review: send-blocking of a permissioned token is a compliance-incident-risk path that previously had zero catalog representation."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - compliance
  - permissioned
  - send
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.ts
automationRefs:
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > blocks when the token is permissioned and the recipient is not allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: 'useIsPermissionedSendBlocked > blocks with reason "sender" when the holder is no longer allowlisted, even to an allowlisted recipient'
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > blocks a self-send when the sender is no longer allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > does not block a native-token send
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a send where the selected token is a permissioned (KYC-gated) tokenized asset
**When** `useIsPermissionedSendBlocked` evaluates the sender and recipient against the allowlist API
**Then** the send is blocked when the recipient is not allowlisted, and blocked with reason "sender" when the holder is no longer allowlisted (even to an allowlisted recipient)
**And** a self-send is allowed while the sender is allowlisted and blocked once the sender is de-allowlisted
**And** native-token sends, non-permissioned tokens, and the no-recipient-yet state are never blocked, and the in-flight allowlist check reports loading without blocking

---
id: rwa-permissioned-swap-kyc-ux
title: Permissioned swap shows banner and Verify Identity KYC bottom sheet
# importance
priority: high
severity: medium
# provenance
source: existing-unit
sourceNote: "Backed by packages/uniswap/src/features/permissionedTokens/PermissionedSwapBanner.test.tsx, VerifyIdentityBottomSheet.test.tsx, and useShouldWaitForPermissionedCheck.test.ts (cited names verified verbatim); PermissionedTokenWarningCard.test.tsx covers the companion warning card. Added per review: the permissioned swap UX half of the blueprint's permissionedTokens code_path was previously uncataloged."
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - rwa
  - compliance
  - permissioned
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/PermissionedSwapBanner.tsx
  - packages/uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet.tsx
  - packages/uniswap/src/features/permissionedTokens/useShouldWaitForPermissionedCheck.ts
automationRefs:
  - path: packages/uniswap/src/features/permissionedTokens/PermissionedSwapBanner.test.tsx
    testName: PermissionedSwapBanner > renders the banner with token symbol when permissioned and not allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/PermissionedSwapBanner.test.tsx
    testName: PermissionedSwapBanner > opens the info bottom sheet on banner press
  - path: packages/uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet.test.tsx
    testName: VerifyIdentityBottomSheet > renders with the permissioned token symbol when isOpen and not allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet.test.tsx
    testName: VerifyIdentityBottomSheet > opens the registration URL and calls onClose when Proceed is pressed
  - path: packages/uniswap/src/features/permissionedTokens/useShouldWaitForPermissionedCheck.test.ts
    testName: useShouldWaitForPermissionedCheck > returns true while the permissioned check is loading (quote must wait)
---

> **high · unit · pr-check · automated** · chains: ethereum

**Given** a swap pair where one side is a permissioned tokenized asset and the connected wallet is not allowlisted
**When** the swap form renders and the user presses the permissioned banner
**Then** the banner renders with the permissioned token's symbol (input or output side) and pressing it opens the info bottom sheet
**And** the Verify Identity bottom sheet renders with the token symbol, pressing Proceed opens the issuer's registration (KYC) URL and closes the sheet, and it renders the unavailable fallback when the issuer or kycUrl is missing
**And** the sheet is not shown when the wallet is already allowlisted or neither side is permissioned, and quoting waits for the permissioned check while it is loading
