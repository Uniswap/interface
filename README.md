# DXswap dapp

An decentralized open source application for DXswap -- a protocol for decentralized exchange of Ethereum tokens governed by a DAO.

## Listing a token

Please see the
[@uniswap/default-token-list](https://github.com/uniswap/default-token-list) 
repository.

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

### Configuring the environment (optional)

To have the interface default to a different network when a wallet is not connected:

1. Make a copy of `.env` named `.env.local`
2. Change `REACT_APP_NETWORK_ID` to `"{YOUR_NETWORK_ID}"`
3. Change `REACT_APP_NETWORK_URL` to e.g. `"https://{YOUR_NETWORK_ID}.infura.io/v3/{YOUR_INFURA_KEY}"` 

Note that the front end only works properly only on kovan ethereum network *for now*.

Factory: [0x1eAcA5a0D7af081ed746964404D7996F34f39616](https://kovan.etherscan.io/address/0x1eAcA5a0D7af081ed746964404D7996F34f39616)
Router: [0x8D70406B983ec7CA89d7ca413815CF3675770888](https://kovan.etherscan.io/address/0x8D70406B983ec7CA89d7ca413815CF3675770888)
WETH: [0xd0a1e359811322d97991e03f863a0c30c2cf029c](https://kovan.etherscan.io/address/0xd0a1e359811322d97991e03f863a0c30c2cf029c)

## Contributions

**Please open all pull requests against the `v2` branch.** 
CI checks will run against all PRs. 
