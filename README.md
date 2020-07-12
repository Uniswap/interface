# DXswap dapp

An decentralized open source application for DXswap -- a protocol for decentralized exchange of Ethereum tokens governed by a DAO.

## Development

### Install Dependencies

```bash
yarn
```

### Configure Environment (optional)

Copy `.env` to `.env.local` and change the appropriate variables.

### Run

```bash
yarn start
```

To have the frontend default to a different network, make a copy of `.env` named `.env.local`, 
change `REACT_APP_NETWORK_ID` to `"{yourNetworkId}"`, and change `REACT_APP_NETWORK_URL` to e.g. 
`"https://{yourNetwork}.infura.io/v3/{yourKey}"`. 

Note that the front end only works properly only on kovan ethereum network *for now*.

Factory: [0x1eAcA5a0D7af081ed746964404D7996F34f39616](https://kovan.etherscan.io/address/0x1eAcA5a0D7af081ed746964404D7996F34f39616)
Router: [0x8D70406B983ec7CA89d7ca413815CF3675770888](https://kovan.etherscan.io/address/0x8D70406B983ec7CA89d7ca413815CF3675770888)
WETH: [0xd0a1e359811322d97991e03f863a0c30c2cf029c](https://kovan.etherscan.io/address/0xd0a1e359811322d97991e03f863a0c30c2cf029c)

## Contributions

**Please open all pull requests against the `v2` branch.** 
CI checks will run against all PRs. 
