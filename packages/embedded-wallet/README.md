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
