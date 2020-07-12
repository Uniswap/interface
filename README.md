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

Factory: (0x5CFc35C07Ca81CCe087e1fEa81096c4A58eE8Ee2)[https://kovan.etherscan.io/address/0x5CFc35C07Ca81CCe087e1fEa81096c4A58eE8Ee2]
Router: (0x203440fbaa18004bdFB09cd5CdC20f9D17E25694)[https://kovan.etherscan.io/address/0x203440fbaa18004bdFB09cd5CdC20f9D17E25694]
WETH: (0xd0a1e359811322d97991e03f863a0c30c2cf029c)[https://kovan.etherscan.io/address/0xd0a1e359811322d97991e03f863a0c30c2cf029c]

## Contributions

**Please open all pull requests against the `v2` branch.** 
CI checks will run against all PRs. 
