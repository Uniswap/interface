/* oxlint-disable typescript/no-unnecessary-condition */
import { Buffer } from 'buffer'

declare global {
  interface Window {
    Buffer: typeof Buffer
  }
}

if (!window.__DEV__) {
  // oxlint-disable-next-line eslint-js/no-restricted-syntax
  window.__DEV__ = process.env.NODE_ENV === 'development'
}

if (!window.Buffer) {
  window.Buffer = Buffer
}
