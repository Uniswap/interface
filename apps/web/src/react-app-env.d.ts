/// <reference types="react-scripts" />

declare module '@metamask/jazzicon' {
  export default function (diameter: number, seed: number): HTMLElement
}

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

declare module 'react-scroll-sync' {
  export interface ScrollSyncProps {
    children?: React.ReactNode
    onSync?(el: Element): void
    proportional?: boolean
    vertical?: boolean
    horizontal?: boolean
    enabled?: boolean
  }

  export interface ScrollSyncPaneProps {
    attachTo?: HTMLElement
    children?: React.ReactNode
    group?: string | string[]
    enabled?: boolean
    // https://github.com/okonet/react-scroll-sync/issues/79
    innerRef?: React.Ref<HTMLElement>
  }

  export const ScrollSync: React.FC<ScrollSyncProps>
  export const ScrollSyncPane: React.FC<ScrollSyncPaneProps>
}
