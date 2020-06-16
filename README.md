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

Factory: (0x40231fd7c05209beb6243afa13fe393a78db03cc)[https://kovan.etherscan.io/address/0x40231fd7c05209beb6243afa13fe393a78db03cc]
Router: (0x9007224a02d5264ae57db5b55215e200b66cc9fd)[https://kovan.etherscan.io/address/0x9007224a02d5264ae57db5b55215e200b66cc9fd]
WETH: (0xdc56fc0606c2f3d02cc05d5acc17b7ace4496d6f)[https://kovan.etherscan.io/address/0xdc56fc0606c2f3d02cc05d5acc17b7ace4496d6f#code]

## Contributions

**Please open all pull requests against the `v2` branch.** 
CI checks will run against all PRs. 
