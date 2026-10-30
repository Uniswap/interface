# Connectors scenarios — Connection plumbing

Web3Provider / wagmi config, the platform connection service, eager auto-connect, and
security-sensitive origin/transport handling. Shared defaults: `_defaults.yaml`.

---
id: connectors-eager-autoconnect
title: Eager auto-connect restores a previously connected wallet on load
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: >-
  The Playwright e2e "Wallet Connection > disconnect wallet"
  (apps/web/src/app/WalletConnection.e2e.test.ts) loads /swap WITHOUT
  eagerlyConnect=false and asserts a connected state before disconnecting, so it
  exercises eager auto-connect — but only via the harness mock connector.
  Persistence of a real injected connection across a browser reload is NOT asserted
  by any automation and remains a manual check.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - autoconnect
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/components/Web3Provider/wagmiAutoConnect.ts
  - apps/web/src/components/Web3Provider/createWeb3Provider.tsx
automationRefs:
  - path: apps/web/src/app/WalletConnection.e2e.test.ts
    testName: Wallet Connection > disconnect wallet
---

> **medium · e2e · release · automated** · platforms: web

**Given** the app loads with eager connect enabled (default; the e2e harness opts out with `eagerlyConnect=false`)
**When** a wallet was previously connected
**Then** the wallet auto-reconnects on load and the connected address is shown without user interaction; with `eagerlyConnect=false` the session starts disconnected

Note (automation scope): the cited e2e exercises eager connect only through the harness mock connector; verifying that a real injected connection persists across a full browser reload is manual.

---
id: connectors-connection-service-error-handling
title: Connection service ignores expected connection errors and rethrows unexpected ones
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: >-
  Backed by createConnectionService.test.ts connect error-handling unit tests (verified
  test names); no Testlio counterpart.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - error-handling
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/features/wallet/connection/services/createConnectionService.ts
  - apps/web/src/features/wallet/connection/services/multiplatformConnectionService.ts
automationRefs:
  - path: apps/web/src/features/wallet/connection/services/createConnectionService.test.ts
    testName: createConnectionService > connect > should handle connection errors and rethrow unexpected errors
  - path: apps/web/src/features/wallet/connection/services/createConnectionService.test.ts
    testName: createConnectionService > connect > should ignore expected connection errors
---

> **medium · unit · pr-check · automated** · platforms: web

**Given** the connection service is asked to connect via a connector ID
**When** the connector rejects
**Then** expected connection errors (e.g. user-rejected) are swallowed without surfacing, unexpected errors are rethrown, and a missing connector ID for the platform is a no-op (no crash)

---
id: connectors-safe-origin-allowlist
title: Safe connector only trusts the canonical Safe app origin
# importance
priority: medium
severity: high
# provenance
source: existing-unit
sourceNote: >-
  Backed by wagmiConfig.test.ts SAFE_ALLOWED_ORIGIN unit tests (canonical-origin match
  plus subdomain/suffix/scheme/path/port spoofing rejections; verified test names); no
  Testlio counterpart.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - security
  - safe
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - apps/web/src/connection/wagmiConfig.ts
automationRefs:
  - path: apps/web/src/connection/wagmiConfig.test.ts
    testName: SAFE_ALLOWED_ORIGIN > matches the canonical Safe web app origin
  - path: apps/web/src/connection/wagmiConfig.test.ts
    testName: SAFE_ALLOWED_ORIGIN > rejects subdomain spoofing
---

> **medium · unit · pr-check · automated** · platforms: web

**Given** the Safe connector origin allowlist (`SAFE_ALLOWED_ORIGIN`)
**When** an origin is checked
**Then** the canonical Safe web app origin matches, and subdomain spoofing, suffix spoofing, http scheme downgrade, path-appended, ported, empty, and arbitrary attacker origins are all rejected

---
id: connectors-wagmi-transport-ordering
title: RPC transport URLs are ordered and de-duplicated for wagmi config
# importance
priority: low
severity: low
# provenance
source: existing-unit
sourceNote: >-
  Backed by wagmiConfig.test.ts orderedTransportUrls unit tests (verified test names);
  no Testlio counterpart.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - rpc
# execution
automatable: true
testLevel: unit
runFrequency: release
# coverage
code_paths:
  - apps/web/src/connection/wagmiConfig.ts
automationRefs:
  - path: apps/web/src/connection/wagmiConfig.test.ts
    testName: orderedTransportUrls > returns URLs in correct order (interface > default > public > fallback) & removes duplicates
---

> **low · unit · release · automated** · platforms: web

**Given** a set of RPC URL sources (interface, default, public, fallback), some empty or duplicated
**When** `orderedTransportUrls` builds the transport list
**Then** URLs are returned in priority order (interface > default > public > fallback), empty/undefined entries are filtered out, and duplicates across arrays are removed

---
id: connectors-extension-passkey-auth-popup
title: Extension-initiated passkey auth popup verifies the extension and completes login or recovery
# importance
priority: high
severity: high
# provenance
source: uniswap
sourceNote: >-
  Derived from code reading of apps/web/src/pages/ExtensionPasskeyAuthPopUp/ (index.tsx
  step machine, useExtensionRecoveryBridge.ts HPKE handshake, views.tsx Login/Export/Denied
  views) — a blueprint-declared code_path with no automated tests and no Testlio suite;
  route is EXTENSION_PASSKEY_AUTH_PATH (/auth/passkey/extension). Cross-app
  extension-to-web message passing plus a real passkey ceremony make this impractical to
  automate in the current harness.
# scope
platforms:
  - web
labels:
  - regression
  - connectors
  - passkey
  - extension-bridge
  - security
wallets:
  - TW-CONNECTORS-03
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - apps/web/src/pages/ExtensionPasskeyAuthPopUp/
  - apps/extension/src/app/features/onboarding/import/
automationRefs: []
---

> **high · e2e · release · manual** · platforms: web

**Given** the Uniswap extension initiates passkey sign-in/recovery, opening the web-app popup at `/auth/passkey/extension` with a request ID, and an embedded (passkey) wallet exists for the tester (TW-CONNECTORS-03)
**When** the popup loads and performs the extension referrer verification handshake
**Then** verification completes within the 3-second timeout and the Login step appears with the passkey ceremony auto-started; cancelling the passkey prompt (dismiss / no matching credential) is non-fatal and leaves the email/OAuth login tiles available for retry; completing the passkey ceremony proceeds to the Export step and the recovery export completes via the HPKE-key handshake with the extension; a failed or missing extension referrer verification shows the Denied view instead of any login UI
