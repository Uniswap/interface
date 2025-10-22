# Deep Link Support

The Uniswap mobile app supports various deep link types to enable seamless navigation from external sources. Deep links allow 3rd parties to prompt the app to open to specific screens when it is installed on their device. If the app isn't installed, it will open that page in the browser.

## Supported Deep Link Types

The app supports several categories of deep links:

1. **Universal Links** - Web app share links (`https://app.uniswap.org/...`)
2. **Screen-based Links** - Direct navigation to specific screens (`https://uniswap.org/app?screen=...`)
3. **Protocol Links** - WalletConnect and other protocol integrations
4. **Widget Links** - Embedded widget interactions
5. **Special Function Links** - Fiat on/off-ramp, token details, etc.

Most screen-based deep links require a valid `userAddress` parameter since the wallet supports multiple imported addresses.

## Universal Links (Uniswap Web App Share Links)

These links allow sharing specific content from the Uniswap web app that opens directly in the mobile app if the app is installed.

### NFT Item Share Links

Mainnet only. Opens a specific NFT item page.

Format: `https://app.uniswap.org/nfts/asset/{contractAddress}/{tokenId}`

Example:

```url
https://app.uniswap.org/nfts/asset/0xbd3531da5cf5857e7cfaa92426877b022e612cf8/1
```

### NFT Collection Share Links

Mainnet only. Opens an NFT collection page.

Format: `https://app.uniswap.org/nfts/collection/{contractAddress}`

Example:

```url
https://app.uniswap.org/nfts/collection/0xbd3531da5cf5857e7cfaa92426877b022e612cf8
```

### Token Share Links

Opens a token details page. Supports both `/tokens/` and `/explore/tokens/` paths.

Format: `https://app.uniswap.org/tokens/{network}/{contractAddress}` or `https://app.uniswap.org/explore/tokens/{network}/{contractAddress}`

Example:

```url
https://app.uniswap.org/tokens/ethereum/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
https://app.uniswap.org/explore/tokens/unichain/0x8f187aA05619a017077f5308904739877ce9eA21
```

### Top Tokens Explore Page

Opens the top tokens page for a specific network with optional metric filtering.

Format: `https://app.uniswap.org/tokens/{network}?metric={metric}` or `https://app.uniswap.org/explore/tokens/{network}?metric={metric}`

Parameters:

- `metric`: the metric to filter the top tokens by. Can be `volume`, `market_cap`, `total_value_locked`, `price_percent_change_1_day_asc`, or `price_percent_change_1_day_desc`

Example:

```url
https://app.uniswap.org/explore/tokens/unichain?metric=volume
```

### Address/Wallet Share Links

Opens a wallet profile page. If the address matches an imported wallet, it switches to that account. Otherwise, it opens the external profile view.

Format: `https://app.uniswap.org/address/{walletAddress}`

Example:

```url
https://app.uniswap.org/address/0x1234567890123456789012345678901234567890
```

### Swap Share Links

Opens the swap interface with pre-filled token pairs and amounts from the web app.

Format: `https://app.uniswap.org/swap?inputCurrency={currency}&outputCurrency={currency}&chain={network}&value={amount}&field={INPUT|OUTPUT}`

Parameters:

- `inputCurrency`: Input token address, "ETH", "NATIVE", or native token representation
- `outputCurrency`: Output token address, "ETH", "NATIVE", or native token representation  
- `chain`: Network name (e.g., "ethereum", "polygon", "arbitrum", "unichain")
- `outputChain`: (Optional) Different output chain for cross-chain swaps
- `value`: (Optional) Amount to swap
- `field`: (Optional) Whether the amount refers to "INPUT" or "OUTPUT" token

Examples:

```url
https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&chain=ethereum&value=1&field=INPUT
https://app.uniswap.org/swap?inputCurrency=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359&outputCurrency=NATIVE&chain=polygon&value=100&field=OUTPUT
```

### Buy Share Links

Opens the fiat on-ramp interface with pre-filled purchase parameters.

Format: `https://app.uniswap.org/buy?value={amount}&currencyCode={currency}&isTokenInputMode={boolean}&providers={providers}`

Parameters:

- `value`: (Optional) Pre-filled purchase amount
- `currencyCode`: (Optional) Target currency code (e.g., "USD", "EUR", "ETH")
- `isTokenInputMode`: (Optional) Set to "true" for token input mode, "false" for fiat input mode
- `providers`: (Optional) Comma-separated list of preferred providers. We'll show only quotes from these providers. If no quotes are available from these providers, we'll show quotes from all available providers.

Examples:

```url
https://app.uniswap.org/buy?value=100&currencyCode=USD&isTokenInputMode=true
https://app.uniswap.org/buy?value=0.5&currencyCode=ETH&providers=moonpay,coinbase
```

## Screen-based Deep Links

These links use query parameters to navigate to specific screens with the prefix `https://uniswap.org/app`.

### Activity Screen

Routes to activity screen for given `userAddress`.

Example:

```url
https://uniswap.org/app?screen=transaction&userAddress=0x123...789
```

### Fiat On-ramp Return Screen

Shows transaction details after completing a fiat on-ramp purchase.

Example:

```url
https://uniswap.org/app?screen=transaction&userAddress=0x123...789&fiatOnRamp=true
```

### Fiat Off-ramp Return Screen

Shows transaction details after completing a fiat off-ramp sale.

Example:

```url
https://uniswap.org/app?screen=transaction&userAddress=0x123...789&fiatOffRamp=true
```

### Swap Screen

When routing to the swap screen, including the various swap data as query parameters will open the swap screen with the swap details populated. Failing to include the required swap parameters or providing invalid parameters will result in the swap screen opening without any details populated.

Parameters:

- `inputCurrencyId`: the currency the user wishes to swap. Must be of format `{chainId}-{tokenAddress}`
- `outputCurrencyId`: the currency the user wishes to receive. Must be of format `{chainId}-{tokenAddress}`
- `currencyField`: used to specify whether `amount` refers to how much the user wishes to expend or receive. Value can either be `input` or `output`
- `amount`: the currency amount the user either wishes to expend or receive

Example (swap 100 Ethereum mainnet DAI for Ethereum mainnet UNI):

```url
https://uniswap.org/app?screen=swap&userAddress=0x123...789&inputCurrencyId=1-0x6B175474E89094C44Da98b954EedeAC495271d0F&outputCurrencyId=1-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&currencyField=input&amount=100
```

Example (swap Polygon DAI for 100 Polygon UNI):

```url
https://uniswap.org/app?screen=swap&userAddress=0x123...789&inputCurrencyId=137-0x6B175474E89094C44Da98b954EedeAC495271d0F&outputCurrencyId=137-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&currencyField=output&amount=100
```

### Swap Link Handling

The app processes swap links through `handleSwapLinkSaga.ts`, which provides robust handling for swap-related deep links with automatic testnet mode detection and error recovery.

#### Features

- **Automatic Parameter Parsing**: Extracts and validates swap parameters from URLs
- **Testnet Mode Alignment**: Automatically detects if the swap involves testnet tokens and prompts for testnet mode switch if needed
- **Graceful Error Handling**: Falls back to opening an empty swap modal if parsing fails
- **Transaction State Creation**: Builds complete swap form state from parsed parameters

#### Process Flow

1. **Parse URL**: Extracts swap parameters using the provided parsing function
2. **Create Form State**: Builds swap transaction state from parsed parameters
3. **Testnet Detection**: Checks if input/output assets are on testnet chains
4. **Mode Alignment**: Compares current testnet mode with required mode
5. **Navigation**: Opens swap modal with pre-filled parameters
6. **Mode Switch**: Prompts testnet switch modal if alignment is needed

#### Error Recovery

If swap link parsing fails, the saga will:

- Log the error with appropriate context
- Navigate to an empty swap modal as fallback
- Ensure the user can still perform swaps manually

### Buy Link Handling

The app supports fiat on-ramp deep links through the `handleBuyLink()` function, which opens the FiatOnRampAggregator modal with pre-filled purchase parameters.

#### Supported Parameters

- `value`: Pre-filled purchase amount
- `currencyCode`: Target currency code (e.g., "USD", "EUR")
- `isTokenInputMode`: Whether to show token input mode (`"true"` or `"false"`)
- `providers`: Comma-separated list of preferred providers (converted to uppercase)

#### Buy Link Features

- **Provider Filtering**: Supports specifying preferred fiat on-ramp providers
- **Amount Pre-filling**: Can pre-populate purchase amounts
- **Currency Selection**: Supports different fiat currencies
- **Input Mode Control**: Can specify token vs fiat input mode
- **Modal Management**: Properly dismisses existing modals before navigation

#### Example Buy Links

```url
https://uniswap.org/app/buy?value=100&currencyCode=USD&isTokenInputMode=true&providers=moonpay,coinbase
```

## Special Function Deep Links

### Token Details

Opens a specific token details page using a currency ID of format `{chainId}-{tokenAddress}`.

Format: `https://uniswap.org/app/tokendetails?currencyId={currencyId}`

Example:

```url
https://uniswap.org/app/tokendetails?currencyId=1-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
```

### Fiat On-ramp (Legacy)

Opens the fiat on-ramp modal for purchasing crypto using the legacy format with user address requirements.

Format: `https://uniswap.org/app/fiatonramp?userAddress={address}&moonpayOnly={boolean}&moonpayCurrencyCode={currency}&amount={amount}`

Parameters:

- `userAddress`: (optional if `moonpayOnly=true`) The user's wallet address
- `moonpayOnly`: (optional) Set to `true` to show only Moonpay options
- `moonpayCurrencyCode`: (optional) Currency code for Moonpay (eth, usdc, etc.)
- `amount`: (optional) Pre-filled amount

Example:

```url
https://uniswap.org/app/fiatonramp?userAddress=0x123...789&moonpayCurrencyCode=eth&amount=100
```

**Note**: For universal buy links from the web app, see [Buy Share Links](#buy-share-links) in the Universal Links section.

## Protocol Deep Links

### WalletConnect

Multiple formats are supported for WalletConnect deep links:

1. **Direct WalletConnect URI**: `wc:{uri}`
2. **Uniswap scheme with WalletConnect**: `uniswap://wc:{uri}`
3. **Universal WalletConnect**: `https://uniswap.org/wc?uri={encodedUri}`
4. **WalletConnect as parameter**: `uniswap://wc?uri={encodedUri}`

### Scantastic (QR Code Scanning)

Custom protocol for QR code scanning functionality.

Format: `uniswap://scantastic?{queryParams}`

### UwU Link

Custom protocol for transaction requests.

Format: `uniswap://uwu?{encodedData}`

### Widget Links

Deep links from embedded Uniswap widgets.

Format: `uniswap://widget/{path}`

## Error Handling

- Invalid or malformed deep links will be logged and ignored
- Missing required parameters will result in navigation to the Home screen
- Unsupported WalletConnect v1 links show an error alert
- Invalid UwU Link requests show appropriate error messages
- Korea-specific restrictions apply to fiat on-ramp links
