# Run the app (interface)

The HookSwap interface is the Uniswap-interface monorepo fork (web + mobile + extension). This
page covers running the **web** app for local dev and building it for a VPS.

## Toolchain

- **bun 1.3.14**, Node (repo pins node 22.22.2 / bun >= 1.3.11).
- Dev server target: `http://localhost:3000` (other ports cause CORS with the Uniswap backend).
- Standard dev command: `bun web dev`.

> **Install note:** `tools/uniswap-nx` was removed from `package.json` workspaces (the folder was
> missing and nothing imports it) — it was breaking `bun install`.

## Local dev on Windows + bun (bring-up bypass)

nx spawns bare `vite` / `typechain` / `openapi`, but bun only creates `.bunx` shims the Windows
shell can't run, so `bun web dev` fails. Bypass:

1. **ABI types:**
   ```bash
   cd packages/uniswap && bun x typechain --target ethers-v5 \
     --out-dir src/abis/types "./src/abis/**/*.json"
   # v3 set:
   xargs -a src/abis/v3-type-filepaths.txt bun x typechain ... --out-dir src/abis/types/v3
   ```
2. **Trading API types** (path-bug workaround — input must be relative to the ref-parser module dir):
   ```bash
   cd packages/api && node ../../node_modules/openapi-typescript-codegen/bin/index.js \
     --input ../../../../packages/api/src/clients/trading/api.json \
     --output ./src/clients/trading/__generated__ \
     --useOptions --exportServices true --exportModels true
   bun ./scripts/modifyTradingApiTypes.mts
   ```
3. **GraphQL types + UI icons:** already committed / regenerate fine.
4. **Launch:**
   ```bash
   cd apps/web && SKIP_CONFIG_PULL=true USE_NEW_CONFIGS=false \
     node ../../node_modules/vite/bin/vite.js dev --port 3000
   ```

## Env / config

The web app reads env from `apps/web/.env.local` (gitignored). Two config validations crash the
app to a blank page unless handled:

- **`WALLETCONNECT_PROJECT_ID`** — the committed `.env` uses `WALLET_CONNECT_PROJECT_ID`
  (underscored), but the legacy config path (`USE_NEW_CONFIGS=false`) reads
  `WALLETCONNECT_PROJECT_ID` and the web schema requires it non-empty. Set a placeholder.
- **`PRIVY_APP_ID` / `PRIVY_CLIENT_ID`** — the committed `.env` ships non-empty placeholder ids, so
  `MaybePrivyProvider` mounts `<PrivyProvider>` with a bogus id and throws. Set **both** to `""` →
  `isPrivyConfigured()` returns false → Privy is skipped. Injected/WalletConnect wallets still work.

With those set, the app renders the HookSwap landing. Remaining console errors are **expected**
backend-auth failures (401 on `*.api.uniswap.org/rpc`, WS auth, compliance CORS) — resolved by
self-hosting RPC/routing.

## Point the app at HookSwap's routing

To quote against HookSwap chains instead of Uniswap's hosted Trading API, set:

```bash
# apps/web/.env.local
TRADING_API_URL_OVERRIDE="https://trading.hookswap.org"
```

Leave it unset to keep the app on Uniswap's default. See
[developers/routing.md](../developers/routing.md) and [run-routing.md](./run-routing.md).

## RPC providers

- **Sepolia** — Infura (`https://sepolia.infura.io/v3/<key>`).
- **The 6 custom chains** — public RPCs (Infura does not serve them); move to dedicated nodes for
  production. See the RPC table in [run-routing.md](./run-routing.md#rpc-config).

## Building for a VPS

Build the web app and serve the static output behind nginx (same VPS pattern as the routing
adapter, or a separate host / static host). The interface is a static SPA once built. Ensure the
production env sets `TRADING_API_URL_OVERRIDE` to the live adapter and the WalletConnect/Privy
values as above.

## Known brand/polish TODOs

- Logo still the Uniswap unicorn in places → swap for the HookSwap hex logo.
- Fonts: the Terminal redesign needs Space Grotesk / IBM Plex Sans / IBM Plex Mono `.woff2` files
  dropped into `apps/web/public/fonts/` (the `@font-face` declarations already point at the paths).
  See [`TERMINAL-DESIGN.md`](../../TERMINAL-DESIGN.md).
