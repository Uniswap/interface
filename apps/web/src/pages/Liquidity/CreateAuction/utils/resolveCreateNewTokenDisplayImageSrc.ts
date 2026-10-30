import { resolveIpfsGatewayUrl } from 'utilities/src/format/gatewayUrls'

/**
 * URL to render for a create-new token logo: prefer the in-memory `blob:` preview (survives step
 * navigation until the gateway image loads), otherwise resolve `ipfs://` through the dedicated
 * IPFS gateway, which fronts the account uploads are pinned to, so a fresh CID loads immediately.
 */
export function resolveCreateNewTokenDisplayImageSrc(
  localImagePreviewUri: string,
  imageUrl: string,
): string | undefined {
  return localImagePreviewUri || resolveIpfsGatewayUrl(imageUrl) || undefined
}
