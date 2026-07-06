// HookSwap: HookSwap ships no wallet, so the Uniswap Mobile "scan to connect" option is not
// promoted anywhere. This component is neutralized (renders nothing) rather than deleted to keep
// the (feature-flag-gated) EmbeddedWalletModal / WalletOptionsGrid call sites intact.
export function UniswapMobileWalletConnectorOption(): null {
  return null
}
