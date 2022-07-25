/// <reference types="react-scripts" />

declare module 'jazzicon' {
  export default function(diameter: number, seed: number): HTMLElement
}

declare module 'fortmatic'

interface Window {
  ethereum?: {
    isMetaMask?: boolean
    isCoin98?: boolean
    on?: (...args: any[]) => void
    removeListener?: (...args: any[]) => void
    request: (params: { method: string; params?: any }) => Promise
  }
  web3?: {}
  version?: string
  coin98?: any
  dataLayer?: any[]
}

declare module 'content-hash' {
  declare function decode(x: string): string
  declare function getCodec(x: string): string
}

declare module 'multihashes' {
  declare function decode(buff: Uint8Array): { code: number; name: string; length: number; digest: Uint8Array }
  declare function toB58String(hash: Uint8Array): string
}
