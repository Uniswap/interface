/// <reference types="react-scripts" />

declare module '@metamask/jazzicon' {
  export default function (diameter: number, seed: number): HTMLElement
}

declare module 'fortmatic'

interface InjectedProvider {
  // value that is populated and returns true by the Coinbase Wallet mobile dapp browser
  isCoinbaseWallet?: true
  isMetaMask?: true
  isTally?: false
  autoRefreshOnNetworkChange?: boolean
}

interface Window {
  // walletLinkExtension is injected by the Coinbase Wallet extension
  walletLinkExtension?: any
  ethereum?: InjectedProvider
  tally?: InjectedProvider
  web3?: Record<string, unknown>
}

declare module 'content-hash' {
  declare function decode(x: string): string
  declare function getCodec(x: string): string
}

declare module 'multihashes' {
  declare function decode(buff: Uint8Array): { code: number; name: string; length: number; digest: Uint8Array }
  declare function toB58String(hash: Uint8Array): string
}
