import { PlatformSplitStubError } from 'utilities/src/errors'

// Privy REST API for encrypted authorization keys
// Docs: https://docs.privy.io/guide/api/encrypted-authorization-keys
// Platform-split: `.web.ts` and `.native.ts` each provide their own `privyHeaders`
// because mobile must set `Origin` explicitly (React Native's `fetch` doesn't) while
// browsers forbid overriding it.

export async function storeEncryptedBlob(_params: {
  accessToken: string
  blob: string
  privyAppId: string
}): Promise<{ keyId: string }> {
  throw new PlatformSplitStubError('storeEncryptedBlob')
}

export async function fetchEncryptedBlob(_params: {
  accessToken: string
  keyId: string
  privyAppId: string
}): Promise<string> {
  throw new PlatformSplitStubError('fetchEncryptedBlob')
}
