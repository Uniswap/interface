/**
 * Token logos are uploaded to and pinned by Pinata, then stored as canonical `ipfs://<cid>` — that
 * canonical form is what we submit to the token launcher. Browsers can't load `ipfs://` directly
 * (no native protocol handler, and CSP `img-src` excludes the scheme), so any read path that hands
 * the value to an `<img>`/canvas — the logo render and the accent-color extraction — must first
 * resolve it to an HTTP(S) gateway.
 *
 * We resolve through Pinata's gateway specifically (rather than the generic `ipfs.io` that the
 * shared `uriToHttpUrls` falls back to) because the CID was just pinned there: it's immediately
 * fetchable, whereas a freshly-minted CID often hasn't propagated to public gateways yet — the same
 * propagation lag the verify-retry in `useTokenImageUpload` exists for.
 *
 * Non-ipfs values pass through unchanged: existing-token https logos, `data:` URIs, and the `blob:`
 * preview URL the upload flow shows before the CID exists.
 */
const PINATA_GATEWAY_IPFS_PREFIX = 'https://gateway.pinata.cloud/ipfs/'

export function resolveTokenImageSrc(uri: string | null | undefined): string | undefined {
  if (!uri) {
    return undefined
  }
  // Mirror the ipfs match in `uriToHttpUrls`: tolerate `ipfs://<cid>` and `ipfs://ipfs/<cid>`.
  const cid = uri.match(/^ipfs:(\/\/)?(ipfs\/)?(.*)$/i)?.[3]
  return cid ? `${PINATA_GATEWAY_IPFS_PREFIX}${cid}` : uri
}
