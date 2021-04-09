# Trust Interface

An open source interface for Trust.Finance -- a protocol for decentralized trust.

- Website: [trust.finance](https://trust.finance/)
- Email: [trustdotfinance@gmail.com](mailto:trustdotfinance@gmail.com)

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

## Contributions

**Please open all pull requests against the `main` branch.**
CI checks will run against all PRs.
