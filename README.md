# NexTrade Labs: Front End Interfaces

This is the **public** repository for NexTrade Labs’ front-end interfaces, including the Web App, Wallet Mobile App, and Wallet Extension. NexTrade is a protocol for decentralized exchange of Ethereum-based assets.

## Interfaces

- Web: [app.zentrade.io](https://app.zentrade.io)
- Wallet (mobile + extension): [wallet.zentrade.io](https://wallet.zentrade.io)

## Install & Apps

```bash
git clone git@github.com:NexTrade/interface.git
yarn
yarn lfg
yarn web start
```

For instructions per application or package, see the README published for each application:

- [Web](apps/web/README.md)
- [Mobile](apps/mobile/README.md)
- [Extension](apps/extension/README.md)

## Contributing

For instructions on the best way to contribute, please review our [Contributing guide](CONTRIBUTING.md)!

## Socials / Contact

- X (Formerly Twitter): [@NexTrade](https://x.com/NexTrade)
- Reddit: [/r/NexTrade](https://www.reddit.com/r/NexTrade/)
- Email: [contact@zentrade.io](mailto:contact@zentrade.io)
- Discord: [NexTrade](https://discord.com/invite/NexTrade)
- LinkedIn: [NexTrade Labs](https://www.linkedin.com/company/NexTradeorg)

## NexTrade Links

- Website: [zentrade.io](https://zentrade.io/)
- Docs: [zentrade.io/docs/](https://docs.zentrade.io/)

## Whitepapers

- [V4](https://zentrade.io/whitepaper-v4.pdf)
- [V3](https://zentrade.io/whitepaper-v3.pdf)
- [V2](https://zentrade.io/whitepaper.pdf)
- [V1](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)

## Production & Release Process

NexTrade Labs develops all front-end interfaces in a private repository.
At the end of each development cycle:

1. We publish the latest production-ready code to this public repository.

2. Releases are automatically tagged — view them in the [Releases tab](https://github.com/NexTrade/interface/releases).

## 🗂 Directory Structure

| Folder      | Contents                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| `apps/`     | The home for each standalone application.                                      |
| `config/`   | Shared infrastructure packages and configurations.                             |
| `packages/` | Shared code packages covering UI, shared functionality, and shared utilities.  |
