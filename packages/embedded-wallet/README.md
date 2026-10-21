# @universe/embedded-wallet

Embedded wallet lifecycle: passkey authentication, signing, device sessions, recovery (PIN/OAuth), and authenticator management.

## Layout

- `src/features/passkey/` — the engine: WebAuthn ceremonies (platform-split), signing, NECK device sessions, PIN/OAuth recovery crypto, authenticator management, EIP-7702 delegation.
- `src/components/passkey/` — the recovery wizard UI shared by web and mobile.
- `src/data/rest/embeddedWallet/` — the embedded wallet REST client.
- `src/connection/` — web-only protocol layer: wagmi connector, EIP-1193 provider, EIP-5792/4337/7702 execution. Barrel exports are platform-stubbed (`PlatformSplitStubError` on native).
- `src/state/` — the web session store (`useEmbeddedWalletState`).
- `src/hooks/` — web lifecycle hooks (sign in / sign out / login-complete). App wiring (redux, modals, drawer, Privy) is injected via each hook's `deps`; apps keep thin wrappers.

## Usage

Import from the package root. Deep imports into `src/` are blocked by lint.

```ts
import { signInWithPasskey, useRecoveryFlow } from '@universe/embedded-wallet'
```

## Boundaries

- Depends on `uniswap` and sits above it in the graph. `packages/wallet` may depend on this package; this package must not import `wallet` (the EIP-5792 capabilities wrapper takes `getCapabilitiesCore` as an injected dependency instead).
- Privy SDKs stay out. Each app implements the `RecoveryPrivyAuth` interface with its own Privy SDK (`@privy-io/react-auth` on web, `@privy-io/expo` on mobile).
- Unrelated name: the `EmbeddedWallet` native module bridged by `packages/wallet`'s `Keyring.native.ts` is a separate keypair/decrypt surface for seed phrase graduation, not this package.

## E2E coverage guard

Any change that adds or alters a transaction signing path ships with an embedded wallet e2e test before rollout. `src/e2eCoverage/e2eCoverageManifest.ts` maps each signing entry point to the web Playwright spec that drives it through `apps/web/src/playwright/fixtures/embeddedWallet.ts`, or to an exemption with a reason. Its unit test (`bunx nx run @universe/embedded-wallet:test`, run per PR by the `unit-tests` CI job) enumerates the real surface: every `case` in `EmbeddedWalletProvider.request`, every runtime export of the modules listed as signing modules, and every module under `src/connection` and `src/features/passkey`, each of which must be listed as signing or as non-signing with a reason. A new provider method, a new export of a signing module, or a new file in those directories fails the test until it has a row, and a `case` label that is not a single-quoted method name fails it too. Signing code added outside those two directories is outside the guard.
