# Token Protection scenarios — Compliance, geogating & permissioned tokens

Cross-surface compliance gates: geo-restriction of restricted assets (compliance-v2 via
`useGeoRestrictionMode`), permissioned (RWA/KYC-gated) token swap & send blocking with the
verify-identity flow, and sanctioned-address screening. Shared defaults: `_defaults.yaml`.

---
id: token-protection-geogating-us-blocked
title: Geogated asset cannot be swapped from a restricted region
# importance
priority: urgent
severity: high
# provenance
source: testlio
sourceNote: "Web Testlio feature 'Geogating'. Mode classification is unit-covered by useGeoRestrictionMode.test.ts ('returns restricted when the output token is hard-blocked (DERIVATIVE)', 'returns restricted when RWA is region-blocked and the token is an RWA', 'fails safe to restricted for an unrecognized (future) reason') — unit-level only, so this e2e case stays manual: it requires a session in a restricted region. An earlier revision cited packages/wallet/src/features/compliance/hooks.ts (sanctioned-address screening, a different gate) — repointed to the real geo-restriction code."
testlioRef: "Geogating"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - compliance
  - geogating
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode.ts
  - packages/uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionCard.tsx
  - packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getGeoRestrictionWarning.ts
automationRefs: []
---

> **urgent · e2e · release · manual** · platforms: web, extension, mobile

**Given** an asset that compliance-v2 hard-blocks for the session's region (e.g. a geogated RWA/derivative) and a session originating from that restricted region (e.g. the US)
**When** the user selects the geogated asset in the swap form
**Then** `useGeoRestrictionMode` resolves `restricted`, the geo-restriction card renders in the swap form with the region-restricted copy naming the token symbol ("not available in your region"; tapping it opens the geo-restriction modal), the swap CTA is disabled (`useIsSwapButtonDisabled` returns disabled while the mode is `restricted`), and no swap can be reviewed or submitted — distinguishing an intentional geoblock from a generic quote failure

---
id: token-protection-geogating-intl-allowed
title: Geogated asset is swappable outside the restricted region
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Web Testlio feature 'Geogating'. Unit-level counterpart: useGeoRestrictionMode.test.ts ('returns default when neither token is restricted', 'returns unrestricted when a token is already acknowledged'). Manual: requires a non-restricted-region session."
testlioRef: "Geogating"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - compliance
  - geogating
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode.ts
  - packages/uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionCard.tsx
automationRefs: []
---

> **medium · e2e · release · manual** · platforms: web, extension, mobile

**Given** the same geogated asset accessed from a region compliance-v2 does not restrict
**When** the user selects the asset and attempts to swap it
**Then** `useGeoRestrictionMode` resolves `default` (or `unrestricted` after acknowledgement for ack-gated tokens), no geo-restriction card is shown, the swap CTA stays enabled, and the user can proceed through review to completion

---
id: token-protection-permissioned-token-kyc-banner
title: Permissioned token shows a verify-identity banner when wallet is not allowlisted
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Derived from existing component tests PermissionedSwapBanner.test.tsx and VerifyIdentityBottomSheet.test.tsx (integration-level RTL tests co-located with the components)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - permissioned
  - kyc
wallets:
  - TW-TOKENPROTECTION-02
# execution
automatable: true
testLevel: integration
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/PermissionedSwapBanner.tsx
  - packages/uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet.tsx
  - packages/uniswap/src/features/permissionedTokens/useTokenKYCStatus.ts
automationRefs:
  - path: packages/uniswap/src/features/permissionedTokens/PermissionedSwapBanner.test.tsx
    testName: PermissionedSwapBanner > renders the banner with token symbol when permissioned and not allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet.test.tsx
    testName: VerifyIdentityBottomSheet > opens the registration URL and calls onClose when Proceed is pressed
---

> **high · integration · pr-check · automated** · platforms: web, extension, mobile

**Given** test wallet TW-TOKENPROTECTION-02 (holds a permissioned/RWA token, not KYC-allowlisted) with a permissioned token on one side of the swap
**When** the user views the swap form and taps the permissioned banner
**Then** the permissioned swap banner renders with the token symbol, the verify-identity bottom sheet opens showing the issuer, and Proceed opens the KYC registration URL; when the wallet is allowlisted the banner is not shown (happy path)

---
id: token-protection-permissioned-swap-blocked-not-allowlisted
title: Permissioned swap is blocked until the wallet is allowlisted
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Derived from existing unit tests getPermissionedPoolWarning.test.ts and usePermissionedSwapPair.test.ts (allowlist resolution describe block)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - permissioned
  - kyc
wallets:
  - TW-TOKENPROTECTION-02
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPermissionedPoolWarning.ts
  - packages/uniswap/src/features/permissionedTokens/usePermissionedSwapPair.ts
  - packages/uniswap/src/features/permissionedTokens/useShouldWaitForPermissionedCheck.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPermissionedPoolWarning.test.ts
    testName: getPermissionedPoolWarning > returns blocked warning when token is permissioned and user is not allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/usePermissionedSwapPair.test.ts
    testName: usePermissionedSwapPair > allowlist resolution
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** test wallet TW-TOKENPROTECTION-02 that is not on the permissioned token's allowlist
**When** the swap warnings are computed for a permissioned token pair
**Then** `getPermissionedPoolWarning` returns a blocking warning, the swap cannot proceed, and when the wallet becomes allowlisted the warning is cleared (returns undefined)

---
id: token-protection-permissioned-send-blocked
title: Sending a permissioned token to a non-allowlisted recipient is blocked
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Derived from the existing unit suite useIsPermissionedSendBlocked.test.ts (recipient/sender allowlist matrix, self-send both ways, native-token exemption, in-flight loading)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - permissioned
  - send
wallets:
  - TW-TOKENPROTECTION-02
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.ts
  - packages/uniswap/src/features/permissionedTokens/useTokenKYCStatus.ts
automationRefs:
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > blocks when the token is permissioned and the recipient is not allowlisted
  - path: packages/uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked.test.ts
    testName: useIsPermissionedSendBlocked > blocks with reason "sender" when the holder is no longer allowlisted, even to an allowlisted recipient
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** test wallet TW-TOKENPROTECTION-02 holding a permissioned token
**When** the user enters a send to a recipient who is not on the token's allowlist (or the sender itself is no longer allowlisted)
**Then** `useIsPermissionedSendBlocked` reports blocked with the correct reason (recipient vs sender), native-token sends and non-permissioned tokens are never blocked, and no send is submitted while the recipient allowlist check is in flight

---
id: token-protection-sanctioned-address-screening
title: Sanctioned active address is screened and blocked
# importance
priority: urgent
severity: urgent
# provenance
source: existing-unit
sourceNote: "Derived from existing unit tests. Mobile/extension screening lives in packages/wallet compliance hooks (useIsBlockedActiveAddress, consumed by the mobile and extension send flows); web screening lives in apps/web/src/hooks/useAccountRiskCheck.ts, which dispatches the BlockedAccount modal — both are cited at unit level so each listed platform's implementation is covered."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - compliance
  - sanctions
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/wallet/src/features/compliance/hooks.ts
  - apps/web/src/hooks/useAccountRiskCheck.ts
automationRefs:
  - path: packages/wallet/src/features/compliance/hooks.test.ts
    testName: useIsBlockedActiveAddress > passes through a blocked result
  - path: packages/wallet/src/features/compliance/hooks.test.ts
    testName: useIsBlockedActiveAddress > screens a signer account by its address
  - path: apps/web/src/hooks/useAccountRiskCheck.test.ts
    testName: useAccountRiskCheck > should handle blocked EVM account
  - path: apps/web/src/hooks/useAccountRiskCheck.test.ts
    testName: useAccountRiskCheck > should handle non-blocked accounts
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** an active signer account whose address is on the sanctions/blocklist
**When** the active account is screened (`useIsBlockedActiveAddress` on mobile/extension, `useAccountRiskCheck` on web)
**Then** the wallet hook screens by the signer address, passes through a blocked result, skips screening for view-only (readonly) accounts and when there is no active account or no address, and reports the loading state while the check is in flight; on web a blocked EVM or SVM address dispatches the BlockedAccount modal naming the blocked address, and non-blocked accounts dispatch nothing

---
id: token-protection-token-kyc-status-unit
title: Token KYC status resolution fails open and threads allowlist state
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Documents the existing useTokenKYCStatus.test.ts suite (fail-open on loading/error/empty, allowlist threading, pre-wallet override, missing address/chainId guards)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - permissioned
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/permissionedTokens/useTokenKYCStatus.ts
automationRefs:
  - path: packages/uniswap/src/features/permissionedTokens/useTokenKYCStatus.test.ts
    testName: useTokenKYCStatus > fails open while the API has no data (loading or error)
  - path: packages/uniswap/src/features/permissionedTokens/useTokenKYCStatus.test.ts
    testName: useTokenKYCStatus > reports isAllowlisted=false with kycUrl when API marks the wallet as not allowlisted
---

> **high · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** varying permissioned-token API responses (loading, error, empty, permissioned/not, allowlisted/not, no wallet connected)
**When** `useTokenKYCStatus` resolves the token's KYC state
**Then** it fails open when data is missing or the API errors, reports `isAllowlisted=false` with a `kycUrl` when not allowlisted, overrides `isAllowlisted=true` pre-wallet so connect-wallet UX takes over, and does not fire the API when the token address or chain id is missing
