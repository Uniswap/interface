import { uniswapUrls } from 'uniswap/src/constants/urls'
import { logger } from 'utilities/src/logger/logger'

type PrivyHeadersBuilder = (input: { accessToken: string; privyAppId: string }) => Record<string, string>

export function createPrivyBlobStore({
  buildHeaders,
  fileTag,
}: {
  buildHeaders: PrivyHeadersBuilder
  fileTag: string
}): {
  storeEncryptedBlob: (params: { accessToken: string; blob: string; privyAppId: string }) => Promise<{ keyId: string }>
  fetchEncryptedBlob: (params: { accessToken: string; keyId: string; privyAppId: string }) => Promise<string>
} {
  async function storeEncryptedBlob({
    accessToken,
    blob,
    privyAppId,
  }: {
    accessToken: string
    blob: string
    privyAppId: string
  }): Promise<{ keyId: string }> {
    const response = await fetch(uniswapUrls.privyEncryptedAuthorizationKeysUrl, {
      method: 'POST',
      headers: buildHeaders({ accessToken, privyAppId }),
      body: JSON.stringify({ ciphertext: blob }),
      credentials: 'include',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error')
      logger.error(new Error(`Failed to store encrypted blob at Privy: ${response.status} ${text}`), {
        tags: { file: fileTag, function: 'storeEncryptedBlob' },
      })
      throw new Error('Failed to store recovery data')
    }

    const data = (await response.json()) as { id: string }
    return { keyId: data.id }
  }

  async function fetchEncryptedBlob({
    accessToken,
    keyId,
    privyAppId,
  }: {
    accessToken: string
    keyId: string
    privyAppId: string
  }): Promise<string> {
    const response = await fetch(`${uniswapUrls.privyEncryptedAuthorizationKeysUrl}/${keyId}`, {
      method: 'GET',
      headers: buildHeaders({ accessToken, privyAppId }),
      credentials: 'include',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error')
      logger.error(new Error(`Failed to fetch encrypted blob from Privy: ${response.status} ${text}`), {
        tags: { file: fileTag, function: 'fetchEncryptedBlob' },
      })
      throw new Error('Failed to fetch recovery data')
    }

    const data = (await response.json()) as { ciphertext: string }
    return data.ciphertext
  }

  return { storeEncryptedBlob, fetchEncryptedBlob }
}
