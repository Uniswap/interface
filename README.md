# Uniswap Labs: Front End Interfaces

This is the **public** repository for Uniswap Labs’ front-end interfaces, including the Web App, Wallet Mobile App, and Wallet Extension. Uniswap is a protocol for decentralized exchange of Ethereum-based assets.

## ZKPassport demo: testing guide

This branch (`martin/zkpassport-demo`) gates Uniswap auction bids on a ZKPassport
credential. Instructions on how to test everything end-to-end locally on Sepolia follow.

The components we will use are this app, the verification popup served from a local
[zkpassport-packages](https://github.com/zkpassport/zkpassport-packages)
checkout, and a script-launched token sale whose validation hook requires a ZKPassport
credential. You need a wallet with some sepolia ETH and the ZKPassport mobile
app with dev mode enabled (the Sepolia policy evaluator accepts mock-document
proofs).

### 1. Link the verify button to a local zkpassport-packages build

The `@zkpassport/ui` button is not a committed dependency. Install here, build
the button in your zkpassport-packages checkout, then symlink it in:

```bash
# in this repo (runtime versions are pinned in .bun-version and .nvmrc)
bun install

# in zkpassport-packages (branch martin/attest-verify-button)
bunx turbo run build --filter=@zkpassport/ui

# in this repo, from apps/web
bun run zkpassport:link-ui <path-to-zkpassport-packages>
```

Rerun the task after any `bun install` here (it prunes the symlink), and
restart the dev server after linking or after rebuilding the ui package.
`bun run zkpassport:link-ui --unlink` undoes it.

### 2. Run the Uniswap web app

```bash
# Place on-chain bids from local dev (the Uniswap liquidity backend is
# CORS-blocked for third-party origins); vite reads this at startup.
echo 'ZKPASSPORT_ONCHAIN_BIDS="true"' > apps/web/.env.override
cd apps/web
SKIP_CONFIG_PULL=true bun run dev   # http://localhost:3000
```

`SKIP_CONFIG_PULL` skips the Uniswap-internal config pull, which needs an SSO
login; the app runs on the checked-in `.env.dev` defaults.

### 3. Run the verification popup

```bash
# in zkpassport-packages
cd packages/verify-popup
bun run dev   # http://localhost:5173
```

The web app opens the popup at `localhost:5173` by default
(`ZKPASSPORT_POPUP_URL` overrides it).

### 4. Launch a token sale gated by a policy

From `apps/web`, with the launcher wallet's key (gas-only spend, three
transactions):

```bash
read -s PRIVATE_KEY && export PRIVATE_KEY
bun scripts/zkpassport-demo-launch.ts
```

The script creates an 18+ policy on the ZKPassportCredentials registry, deploys
a stock-equivalent ERC-1155 validation hook bound to it, and sends the launcher
multicall. Optional env: `TOKEN_NAME`, `TOKEN_SYMBOL`, `MIN_AGE`, `RPC_URL`,
`REGISTRY`, and `POLICY_ID` / `HOOK_ADDRESS` to reuse pieces from a previous
run. It prints the auction address and the bidder page URL. Bidding opens
about 10 minutes after launch; the auction runs for roughly 4 hours.

### 5. Bid as a verified user

Open `http://localhost:3000/explore/auctions/ethereum_sepolia/<auction>`. Be patient, the unbundled version
of the app takes relatively long to load hundreds of MB's of assets, but it eventually does it.
Once it loaded, connect a wallet. What to expect:

- The bid form detects the gate (it reads `erc1155()`/`tokenId()` off the
  auction's validation hook and matches the registry) and shows a
  **Verify with ZKPassport** button instead of accepting bids.
- The button opens the popup in a new tab. Connect the **same wallet** there —
  the credential is minted to the account chosen in the popup, and the gate
  only unlocks for the wallet holding it.
- Scan the QR with the ZKPassport mobile app in dev mode (mock passport),
  approve, and the popup submits the `issue()` mint transaction.
- Back on the bid page the credential balance refreshes automatically and the
  bid form unlocks — no reload. Place a bid; it is encoded locally and sent
  on-chain.

## Interfaces

- Web: [app.uniswap.org](https://app.uniswap.org)
- Wallet (mobile + extension): [wallet.uniswap.org](https://wallet.uniswap.org)

## Install & Apps

```bash
git clone git@github.com:Uniswap/interface.git
bun install
bun web start
```

For instructions per application or package, see the README published for each application:

- [Web](apps/web/README.md)
- [Mobile](apps/mobile/README.md)
- [Extension](apps/extension/README.md)

## Contributing

For instructions on the best way to contribute, please review our [Contributing guide](CONTRIBUTING.md)!

## Socials / Contact

- X (Formerly Twitter): [@Uniswap](https://x.com/Uniswap)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- Email: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.com/invite/uniswap)
- LinkedIn: [Uniswap Labs](https://www.linkedin.com/company/uniswaporg)

## Uniswap Links

- Website: [uniswap.org](https://uniswap.org/)
- Docs: [uniswap.org/docs/](https://docs.uniswap.org/)

## Whitepapers

- [V4](https://uniswap.org/whitepaper-v4.pdf)
- [V3](https://uniswap.org/whitepaper-v3.pdf)
- [V2](https://uniswap.org/whitepaper.pdf)
- [V1](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)

## Production & Release Process

Uniswap Labs develops all front-end interfaces in a private repository.
At the end of each development cycle:

1. We publish the latest production-ready code to this public repository.

2. Releases are automatically tagged — view them in the [Releases tab](https://github.com/Uniswap/interface/releases).

## 🗂 Directory Structure

| Folder      | Contents                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| `apps/`     | The home for each standalone application.                                      |
| `config/`   | Shared infrastructure packages and configurations.                             |
| `packages/` | Shared code packages covering UI, shared functionality, and shared utilities.  |
