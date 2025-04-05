# Kromatika Dapp

Based on a fork of uniswap-interface, to include advanced features developped by Kromatika DAO.

- Website: [kromatika.finance](https://kromatika.finance/)
- Metaswap: [app.kromatika.finance/swap](https://app.kromatika.finance/swap)
- Fees Earning Limit Orders: [app.kromatika.finance/limitorder](https://app.kromatika.finance/limitorder)
- Docs: [docs.kromatika.finance](https://docs.kromatika.finance/)
- Whitepaper: [Kromatika Whitepaper](https://docs.kromatika.finance/fundamentals/white-paper)
  <br/><br/>

Kromatika is developped by the Kromatika DAO, a community-driven DAO that aims to build a decentralized financial infrastructure.

- DAO Manifesto: [Kromatika DAO Manifesto](https://docs.kromatika.finance/fundamentals/kromatika-dao-manifesto)  
  <br/>

Find more information about Kromatika DAO and Kromatika on our socials.

- Twitter: [@KromatikaFi](https://x.com/KromatikaFi)
- Discord: [Kromatika.Finance](https://discord.gg/5fWzdmkz9S)
- Telegram Discussion: [Kromatika.Finance Official](https://t.me/kromatika_finance)
- Telegram Announcements: [KromatikaNews](https://t.me/KromatikaNews)
- Medium: [Kromatika DAO](https://kromatika-finance.medium.com/)

## About Kromatika

Kromatika is an innovative MetaDEX Aggregator, developped by the Kromatika DAO.
Current working products on ETH L1, Arbitrum, Optimism, Polygon, (BNB on perps)

Products include:

- FELO Fees Earning Limit Orders (no else has perfected this yet)
  - Place a Limit order, get your limit order filled and earn 1%-9% extra in LP rewards
- Regular and Gasless Swaps
  - Aggregates from multiple aggregators
  - Essentially it means you won’t need a native chain token to pay for gas fees when swap token A for token B - for example on L1 you won’t need ETH anymore. Instead your swap fees will be paid in the output-token from your swap.
- Perpetual Trading
  - on ETH L1, Arbitrum and BNB
  - V1: Orderbook perps with over 72 pairs
  - V2: Onchain perps with degen mode up to 500x + Forex
- Swapbox
  - Any Protocol can now integrate Kromatika DEX aggregator on their website with 1 line of code as a widget.

## Setting up Kromatika Interface on local machine

### 1. clone from github to machine

```bash
git clone https://github.com/Kromatika-Finance/interface.git
```

### 2. [install nvm (node version manager)](https://github.com/nvm-sh/nvm) to manage node versions on your machine (if not already installed)

### 3. install yarn package manager globally(if not already installed)

```bash
npm install -g yarn
```

### 4. install node version 16 (if not already installed)

```bash
nvm install 16
```

### 5. switch node version to 16

```bash
nvm use 16
```

### 6. open terminal for kromatika interface directory

### 7. install all dependencies

```bash
yarn install
```

### 8. run project post install command to installs ABIs of the smart contracts

```bash
  yarn postinstall
```

### 9. run project locally on machine

```bash
  yarn start
```
