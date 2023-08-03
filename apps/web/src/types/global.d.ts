declare global {
  interface Window {
    ethereum?: UniswapInjectedProvider
    isUniswapExtensionInstalled?: boolean
  }
}
