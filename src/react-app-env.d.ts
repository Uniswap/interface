/// <reference types="react-scripts" />

declare module 'jazzicon' {
  export default function (diameter: number, seed: number): HTMLElement
}

declare module 'fortmatic'

interface Navigator {
  brave?: {
    isBrave: () => Promise<boolean | undefined>
  }
}
interface Window {
  ethereum?: {
    isMetaMask?: boolean
    isCoin98?: boolean
    isBraveWallet?: any
    on?: (...args: any[]) => void
    removeListener?: (...args: any[]) => void
    request: (params: { method: string; params?: any }) => Promise<any>
  }
  web3?: any
  tag?: string
  coin98?: any
  dataLayer?: any[]
  chrome?: any
  opr?: any
}

declare module 'content-hash' {
  function decode(x: string): string
  function getCodec(x: string): string
}

declare module 'multihashes' {
  function decode(buff: Uint8Array): { code: number; name: string; length: number; digest: Uint8Array }
  function toB58String(hash: Uint8Array): string
}
