export const CONNECTION_PROVIDER_IDS = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  UNISWAP_WALLET_CONNECT_CONNECTOR_ID: 'uniswapWalletConnect',
  INJECTED_CONNECTOR_TYPE: 'injected',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  COINBASE_RDNS: 'com.coinbase.wallet',
  METAMASK_RDNS: 'io.metamask',
  UNISWAP_EXTENSION_RDNS: 'org.uniswap.app',
  SAFE_CONNECTOR_ID: 'safe',
  EMBEDDED_WALLET_CONNECTOR_ID: 'embeddedUniswapWalletConnector',
  BINANCE_WALLET_CONNECTOR_ID: 'wallet.binance.com',
  BINANCE_WALLET_RDNS: 'com.binance.wallet',
  PORTO_CONNECTOR_ID: 'xyz.ithaca.porto',
  MOCK_CONNECTOR_ID: 'mock',
} as const

export const CONNECTION_PROVIDER_NAMES = {
  WALLET_CONNECT: 'WalletConnect',
  EMBEDDED_WALLET: 'Uniswap Embedded Wallet',
  METAMASK: 'MetaMask',
  UNISWAP_EXTENSION: 'Uniswap Extension',
  UNISWAP_WALLET: 'Uniswap Wallet',
  PHANTOM: 'Phantom',
  COINBASE_SDK: 'Coinbase Wallet',
  COINBASE_SOLANA_WALLET_ADAPTER: 'Coinbase Wallet',
  SAFE: 'Safe',
  BINANCE_WALLET: 'Binance Wallet',
} as const
