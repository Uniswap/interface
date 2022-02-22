# Swapr dapp

An open source decentralized application for Swapr -- a protocol for decentralized exchange of Ethereum tokens governed by the DXdao.

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

## Publish

Swapr releases are published to the IPFS at [swapr.eth](https://swapr.eth.link). Before publishing, however, the [IPFS hash](https://docs.ipfs.io/concepts/hashing/) to be verified. To verfiy a release a hash, do the following:

Clone the repo

```bash
git clone https://github.com/levelkdev/dxswap-dapp.git
```

Install dependencies using Yarn

```bash
yarn install --force
```

Build the app

```bash
yarn ipfs-build
```

Upload the build directory content to IPFS using [IPFS CLI](https://docs.ipfs.io/install/command-line/#system-requirements)

```bash
ipfs add -rn build
```

The last line of the output will have the IPFS hash. Different machines should output the same hash in order to publish the release.
