/// <reference types="react-scripts" />

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
    isCoinbaseWallet?: boolean
    isTrustWallet?: boolean
    on?: (...args: any[]) => void
    removeListener?: (...args: any[]) => void
    request: (params: { method: string; params?: any }) => Promise<any>
    selectedProvider?: {
      isCoinbaseBrowser: boolean
      isCoinbaseWallet: boolean
      isMetaMask: boolean
    }
    providers?: any[]
  }
  web3?: {
    currentProvider?: {
      isCoinbaseBrowser: boolean
      isCoinbaseWallet: boolean
    }
  }
  tag?: string
  coin98?: any
  coinbaseWalletExtension?: any
  dataLayer?: any[]
  chrome?: any
  opr?: any
  solana?: any
  recaptchaOptions?: any
}

declare module 'content-hash' {
  function decode(x: string): string
  function getCodec(x: string): string
}

declare module 'multihashes' {
  function decode(buff: Uint8Array): { code: number; name: string; length: number; digest: Uint8Array }
  function toB58String(hash: Uint8Array): string
}
