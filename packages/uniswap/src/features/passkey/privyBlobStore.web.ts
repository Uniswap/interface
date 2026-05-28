import { createPrivyBlobStore } from 'uniswap/src/features/passkey/privyBlobStore.shared'

/**
 * Web `fetch` sets `Origin` automatically and forbids overriding it, so Privy's
 * allowed-origin check receives the real browser origin without any extra work.
 */
export const { storeEncryptedBlob, fetchEncryptedBlob } = createPrivyBlobStore({
  fileTag: 'privyBlobStore.web.ts',
  buildHeaders: ({ accessToken, privyAppId }) => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'privy-app-id': privyAppId,
  }),
})
