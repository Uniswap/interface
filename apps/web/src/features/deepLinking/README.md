# Deep Link Support

This guide explains how to create URLs that link directly to specific pages and features on the Uniswap web application (`app.uniswap.org`). These URLs work seamlessly with the mobile app through universal links.

## Trading Interfaces

### Swap

Opens the swap interface with pre-filled token pairs, amounts, and chain selection.

**Format:**

```url
https://app.uniswap.org/swap?inputCurrency={address}&outputCurrency={address}&chain={network}&outputChain={network}&value={amount}&field={INPUT|OUTPUT}
```

**Parameters:**

- `inputCurrency` - Input token address, `ETH`, or `NATIVE`
- `outputCurrency` - Output token address, `ETH`, or `NATIVE`
- `chain` - Network name for input token
- `outputChain` - (Optional) Different output network for cross-chain swaps
- `value` - (Optional) Amount to swap
- `field` - (Optional) Whether the amount refers to `INPUT` or `OUTPUT` token

**Examples:**

```url
https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&chain=ethereum
https://app.uniswap.org/swap?inputCurrency=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&outputCurrency=NATIVE&chain=ethereum&value=100&field=INPUT
https://app.uniswap.org/swap?inputCurrency=NATIVE&outputCurrency=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359&chain=polygon&outputChain=base
```

### Buy (Fiat On-Ramp)

Opens the fiat on-ramp interface for purchasing crypto with fiat currency.

**Format:**

```url
https://app.uniswap.org/buy?value={amount}&currencyCode={code}&isTokenInputMode={boolean}&providers={providers}
```

**Parameters:**

- `value` - (Optional) Pre-filled purchase amount
- `currencyCode` - (Optional) Target crypto currency code
  - Format: `{TOKEN_SYMBOL}_{CHAIN_NAME}` (e.g., `UNI_UNICHAIN`, `USDC_BASE`)
  - Or just `{TOKEN_SYMBOL}` for mainnet (e.g., `ETH`, `UNI`)
- `isTokenInputMode` - (Optional) `true` for token input mode, `false` for fiat input mode
- `providers` - (Optional) Comma-separated list of preferred providers (e.g., `moonpay,coinbasepay`)

**Examples:**

```url
https://app.uniswap.org/buy
https://app.uniswap.org/buy?value=100&currencyCode=ETH
https://app.uniswap.org/buy?value=0.5&currencyCode=UNI_UNICHAIN&providers=moonpay,coinbasepay
https://app.uniswap.org/buy?value=1000&currencyCode=USDC_BASE&isTokenInputMode=false
```

### Sell (Fiat Off-Ramp)

Opens the fiat off-ramp interface for selling crypto for fiat currency.

**Format:**

```url
https://app.uniswap.org/sell
```

**Note:** Parameters are typically added by the provider when users return from completing a transaction.

### Limit Orders (Web Only)

Opens the limit orders trading interface with optional pre-filled token pairs.

**Format:**

```url
https://app.uniswap.org/limit?inputCurrency={address}&outputCurrency={address}&chain={network}
```

**Parameters:**

- `inputCurrency` - Input token address, `ETH`, or `NATIVE`
- `outputCurrency` - Output token address, `ETH`, or `NATIVE`
- `chain` - Network name

**Note:** Limit orders are currently supported on select chains only.

**Examples:**

```url
https://app.uniswap.org/limit
https://app.uniswap.org/limit?inputCurrency=NATIVE&outputCurrency=0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&chain=ethereum
```

### Send (Web Only)

Opens the send tokens interface for transferring tokens to another address.

**Format:**

```url
https://app.uniswap.org/send
```

**Note:** Currently doesn't support pre-filled parameters via URL.

## Explore & Browse

### Explore Page

Browse tokens, pools, and trending assets.

**Format:**

```url
https://app.uniswap.org/explore
```

**With specific tab:**

```url
https://app.uniswap.org/explore/tokens
https://app.uniswap.org/explore/pools
https://app.uniswap.org/explore/transactions
```

### Token Pages

#### View a Specific Token

Opens a token's detail page with charts, price information, and trading options.

**Format:**

```url
https://app.uniswap.org/explore/tokens/{chainName}/{tokenAddress}
```

**Parameters:**

- `chainName` - Network name: `ethereum`, `polygon`, `arbitrum`, `optimism`, `base`, `bnb`, `avalanche`, `celo`, `blast`, `zora`, `zksync`, `worldchain`, or `unichain`
- `tokenAddress` - Token contract address, or `NATIVE` for the chain's native currency (ETH, MATIC, etc.)

**Examples:**

```url
https://app.uniswap.org/explore/tokens/ethereum/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
https://app.uniswap.org/explore/tokens/unichain/NATIVE
https://app.uniswap.org/explore/tokens/base/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

**Legacy Format (also supported):**

```url
https://app.uniswap.org/tokens/{chainName}/{tokenAddress}
```

#### Browse Tokens by Network

Opens the token explorer page filtered to a specific network.

**Format:**

```url
https://app.uniswap.org/explore/tokens/{chainName}
```

**Note:** If no chain name is provided, defaults to all chains.

**Examples:**

```url
https://app.uniswap.org/explore/tokens/ethereum
https://app.uniswap.org/explore/tokens/unichain
https://app.uniswap.org/explore/tokens
```

### Pool Pages (Web Only)

#### View a Specific Pool

Opens a liquidity pool's detail page with trading information and liquidity data.

**Format:**

```url
https://app.uniswap.org/explore/pools/{chainName}/{poolAddress}
```

**Parameters:**

- `chainName` - Network name
- `poolAddress` - Pool contract address

**Example:**

```url
https://app.uniswap.org/explore/pools/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640
```

## Tips for Creating Deep Links

### Supported Networks

- `ethereum` (Ethereum Mainnet)
- `polygon` (Polygon)
- `arbitrum` (Arbitrum One)
- `optimism` (Optimism)
- `base` (Base)
- `bnb` (BNB Chain)
- `avalanche` (Avalanche C-Chain)
- `celo` (Celo)
- `blast` (Blast)
- `zora` (Zora)
- `zksync` (zkSync Era)
- `worldchain` (World Chain)
- `unichain` (Unichain)

### Native Currency Formats

You can specify native currencies (ETH, MATIC, etc.) in several ways:

- `NATIVE` - Works on any chain
- `ETH` - Works on Ethereum and Ethereum Layer 2s
- Actual native token address

### Case Sensitivity

- Network names are **case-insensitive** (`Ethereum` = `ethereum`)
- Token addresses are **case-insensitive**
- Parameter names are **case-sensitive** (`inputCurrency` ≠ `InputCurrency`)

### URL Domains

Both domains work identically:

- `https://app.uniswap.org/...`
- `https://uniswap.org/...`

### Mobile Compatibility

All these URLs work seamlessly with the Uniswap mobile app via universal links. When users click these links on mobile devices with the app installed, they'll open directly in the app.

### Bookmarking & Sharing

- All URLs can be bookmarked for quick access
- URLs preserve their state during wallet connection
- Share links with pre-filled trading parameters for easier onboarding

### Testing Your Links

1. Copy any URL from the examples above
2. Paste it into your browser
3. Verify the interface opens with correct pre-filled values
4. Test on both desktop and mobile browsers

---

## Technical Implementation Details

This section provides technical details for developers integrating these URLs into their applications.

### URL Processing Architecture

**Routing System:**

- Route definitions: `apps/web/src/pages/RouteDefinitions.tsx`
- All supported paths: `apps/web/src/pages/paths.ts`
- React Router with `matchPath()` for parameter extraction

**Query Parameter Processing:**

1. **Swap Parameters** (`state/swap/hooks.tsx`):
   - `queryParametersToCurrencyState()` - Parses currency addresses, chain IDs, amounts, and field
   - `parseCurrencyFromURLParameter()` - Validates and normalizes currency addresses
   - `getParsedChainId()` - Extracts and validates chain ID from query string
   - `useInitialCurrencyState()` - Main hook that processes URL parameters

2. **Buy/Sell Parameters** (`pages/Swap/Buy/hooks.ts`):
   - `useSearchParams()` - React Router hook for accessing query parameters
   - `useOffRampTransferDetailsRequest()` - Parses off-ramp return parameters
   - `BuyFormInner` component processes URL parameters on mount

3. **Limit Orders** (`pages/Swap/Limit/LimitForm.tsx`):
   - Shares currency state with swap interface via `SwapAndLimitContext`
   - `LimitContext` manages limit-specific state (price, expiry)
   - Only available on chains in `LIMIT_SUPPORTED_CHAINS` array

**Tab-based Navigation:**

Trading interfaces (`/swap`, `/buy`, `/sell`, `/limit`, `/send`) all render the same `<Swap />` component:

- Tab state is determined by the pathname
- Mapping defined in `PATHNAME_TO_TAB` constant
- URL changes automatically update the active tab

**Cross-Platform Compatibility:**

- Mobile app opens web URLs via universal links (configured in `apple-app-site-association`)
- Web URLs use same parameter names as mobile deep links where possible
- Mobile app converts web URLs to native navigation

**Error Handling:**

- Invalid chain names default to mainnet
- Unsupported chains redirect to supported alternatives
- Invalid token addresses show "not found" error
- Missing required parameters fall back to empty states
- Users can still interact with interface even with invalid URL parameters

**Chain ID Validation:**

- `useSupportedChainId()` validates chain IDs
- `useEnabledChains()` checks testnet/mainnet mode compatibility
- `getChainInfo()` retrieves chain metadata
- Unsupported chains prompt chain switching UI

**Currency Loading:**

- `useCurrency()` hook loads currency objects from addresses
- Supports ERC20 tokens and native currencies
- Caches currency data for performance
- Falls back gracefully for invalid addresses
