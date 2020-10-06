/// <reference types="react-scripts" />

import { type } from 'os'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: true
      on?: (...args: any[]) => void
      removeListener?: (...args: any[]) => void
    }
    web3?: {}
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    PUBLIC_URL: string
    REACT_APP_FORTMATIC_KEY: string
    REACT_APP_PORTIS_ID: string,
    REACT_APP_INFURA_ID: string
  }
}