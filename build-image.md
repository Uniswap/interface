## Development

### Change nodejs version

`nvm use`

### Install Dependencies

```bash
yarn
yarn postinstall
```

### Run

```bash
yarn start
```

### Build

`yarn build`

### Build docker image

```shell
docker build -t uniswap-interface:local .
```

### Test by container

Start the uniswap interface container:

```shell
docker run -d -p 80:80 uniswap-interface:local
```

Add the [token list](https://gist.githubusercontent.com/alexshliu/2aa5edb61d8d0e6502428c0f5531bada/raw/3399420e16bcba63cf25beb0a1e0c5da60392ef0/taiko-internal-token-list.json) to token list on uniswap interface, then you can add liquidity and swap.
