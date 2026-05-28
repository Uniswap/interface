export const TEAM = 'privy-embedded-wallet'

export const PRIVY_EMBEDDED_WALLET_RUNBOOK =
  'https://www.notion.so/uniswaplabs/embedded-wallet-305c52b2548b80fa9bc5e52b35baf684'

export const UNIVERSE_REPO_URL = 'https://github.com/Uniswap/universe'

export const SERVICE_README_URL = `${UNIVERSE_REPO_URL}/tree/main/packages/datadog-cloud/monitors/privy-embedded-wallet`

// ALB filter — privy-wallet-lb is the load balancer name in AWS.
// Scoped by environment from Pulumi stack config so prod/staging monitors don't overlap.
export const albTagFilter = (environment: string): string => `name:privy-wallet-lb,unienv:${environment}`

// APM filter for trace metrics. service:privy-embedded-wallet is the registered DD service name.
export const apmTagFilter = (environment: string): string => `service:privy-embedded-wallet,env:${environment}`

// Proto service prefix for per-resource APM metric names.
// Per-endpoint metrics are emitted as:
//   trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService_<Endpoint>
//   trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService_<Endpoint>.hits
//   trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService_<Endpoint>.errors
export const APM_METRIC_PREFIX = 'trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService'
