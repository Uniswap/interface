# HookSwap: Front-End Interface

This is the repository for **HookSwap**'s front-end interface — a multi-chain DEX for
decentralized exchange of on-chain assets, built on a proven v2 + v3 AMM model and live across
seven chains.

## Interfaces

- Web app: [hookswap.org](https://hookswap.org)
- Docs: [docs.hookswap.org](https://docs.hookswap.org)

## Install & run

```bash
git clone git@github.com:HooksOS/HookSwap.git
bun install
bun web start
```

For per-application instructions, see the README published for the app:

- [Web](apps/web/README.md)

## Contributing

For instructions on the best way to contribute, please review our [Contributing guide](CONTRIBUTING.md).

## Links

- Website: [hookswap.org](https://hookswap.org)
- Docs: [docs.hookswap.org](https://docs.hookswap.org)
- GitHub: [github.com/HooksOS](https://github.com/HooksOS)
- Launchpad: [hookos.fun](https://hookos.fun/atlas)

## Socials / Contact

- X: [@hookosfun](https://x.com/hookosfun)
- Telegram: [HookOS Portal](https://t.me/HookOSPortal)
- Telegram (Trending): [HookOS Deploys](https://t.me/hookosdeploys)

## 🗂 Directory Structure

| Folder        | Contents                                                                      |
| ------------- | ----------------------------------------------------------------------------- |
| `apps/`       | The standalone applications (the web app).                                    |
| `config/`     | Shared infrastructure packages and configurations.                            |
| `packages/`   | Shared code packages covering UI, shared functionality, and shared utilities. |
| `contracts/`  | HookSwap contract deployment records, per chain.                              |
| `docs-site/`  | The public documentation site ([docs.hookswap.org](https://docs.hookswap.org)). |
