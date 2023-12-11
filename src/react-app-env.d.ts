/// <reference types="react-scripts" />

declare module '@metamask/jazzicon' {
  export default function (diameter: number, seed: number): HTMLElement
}

declare module 'fortmatic'

interface Window {
  ethereum?: {
    isMetaMask?: true
    on?: (...args: any[]) => void
    removeListener?: (...args: any[]) => void
    autoRefreshOnNetworkChange?: boolean
  }
  web3?: Record<string, unknown>
  safary?: {
    track: (args: {
      eventType: string
      eventName: string
      parameters?: { [key: string]: string | number | boolean }
    }) => void
    trackSwap: (args: {
      eventName?: string
      fromAmount: number
      fromCurrency: string
      fromAmountUSD?: number
      contractAddress: string
      parameters?: { [key: string]: string | number | boolean }
    }) => void
    trackDeposit: (args: {
      eventName?: string
      amount: number
      currency: string
      amountUSD?: number
      contractAddress: string
      parameters?: Record<string, unknown>
    }) => void
    trackWithdraw: (args: {
      eventName?: string
      amount: number
      currency: string
      amountUSD?: number
      contractAddress: string
      parameters?: Record<string, unknown>
    }) => void
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
