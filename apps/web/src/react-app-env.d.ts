/// <reference types="vite/client" />

interface Window {
  GIT_COMMIT_HASH?: string
  // TODO: Remove all references to window.ethereum once old injection process is fully deprecated
  ethereum?: {
    autoRefreshOnNetworkChange?: boolean

    // Flags set by injected wallet extensions/browsers:
    isMetaMask?: true // set by MetaMask (and by some non-MetaMask wallets that inject as MetaMask)
    isCoinbaseWallet?: true
    isBraveWallet?: true
    isRabby?: true
    isTrust?: true
    isLedgerConnect?: true
  }
  // Binance extension injected properties
  // Note: These follow the EIP-1193 Ethereum Provider standard
  BinanceChain?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on?: (event: string, handler: (...args: unknown[]) => void) => void
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
    isConnected?: () => boolean
    isTrustWallet?: boolean
  }
  binancew3w?: {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on?: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
      isConnected?: () => boolean
    }
  }
}

declare module 'content-hash' {
  declare function decode(x: string): string
  declare function getCodec(x: string): string
}

declare module 'multihashes' {
  declare function decode(buff: Uint8Array): { code: number; name: string; length: number; digest: Uint8Array }
  declare function toB58String(hash: Uint8Array): string
}

declare module '*.webm' {
  const src: string
  export default src
}

declare module '*.mov' {
  const src: string
  export default src
}

declare module '*.svg' {
  import React from 'react'
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>
  export { ReactComponent }
  const src: string
  export default src
}

declare module '*.svg?url' {
  const content: string
  export default content
}
