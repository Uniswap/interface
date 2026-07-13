import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { createPrivyBlobStore } from 'uniswap/src/features/passkey/privyBlobStore.shared'

/**
 * React Native's `fetch` does not set `Origin` automatically, so Privy 403s with
 * `missing_origin` on mobile. Set it explicitly to the canonical prod origin, which
 * is whitelisted across all Privy tenants.
 */
export const { storeEncryptedBlob, fetchEncryptedBlob } = createPrivyBlobStore({
  fileTag: 'privyBlobStore.native.ts',
  buildHeaders: ({ accessToken, privyAppId }) => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'privy-app-id': privyAppId,
    Origin: UniswapStaticUrls.requestOriginUrl,
  }),
})
