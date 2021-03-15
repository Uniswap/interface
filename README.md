# Trojan Finance

An open source interface for Trojan Finance, based in Uniswap Interface.

## What Trojan Finance can do for you?

The Trojan Finance platform gives the user the opportunity to take trading decisions based on future transactions.
It monitors the mempool (pending transactions) and displays the most possible future result of each trade, based on Uniswap SDK.

- **App**: [beta-uniswap.trojan.finance](https://beta-uniswap.trojan.finance)
- Website: [trojan.finance](https://trojan.finance)
- Twitter: [@trojanfinance](https://twitter.com/trojanfinance)
- Discord: [TrojanFinance](https://discord.gg/VZkFP78aeF)
- Medium: [@trojanfinance](https://medium.com/@trojanfinance)

# Accessing the Trojan Interface

To access the Trojan Interface visit [beta-uniswap.trojan.finance](https://beta-uniswap.trojan.finance).

Trojan Finance Interface is based on Uniswap Interface, we had removed features that we dont use for now, like Pools, Votes, Staking, V1 Trades.

We added a server connection to expose mempool transactions via web socket for live and fast updates. **This feature do not mess with any wallet integration** its a one way web socket and we dont send to our server any information about users.

We have opened this repository so **users can check this and trust that we follow the same way Uniswap works with wallets.** We will be updating any updates from Uniswap repository as soon as we can.

**Anyway use at your own risk. This is a beta version** and we are still improving our mempool scanner, decoder, compute and predictions.

# Development

Check the code by yourself. Download or clone this repository.

```bash
git clone https://github.com/we-commit/trojan-finance-interface.git
```

## Install Dependencies

```bash
yarn
```

## Run

```bash
yarn dev
```

## Configuring the environment (optional)

Note that the interface only works on main net. The interface will not work on other networks.
We only **scan, compute and predict trades** for Ethereum mainnet.

- Make a copy of `.env` named `.env.local`

For now, **in beta phase**, we listen Uniswap transactions for a couple of tokens.

# Proposals

We are working hard to get this working. Trojan Finance is under active development.

- **Proposals to add tokens will be available soon.**

- **Proposals to add other dexes will be opened soon**

# Community

We are stronger together. Jump in [Discord](https://discord.gg/VZkFP78aeF) and stay tuned.
