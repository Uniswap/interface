import { resolveTokenImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveTokenImageSrc'

/**
 * URL to render for a create-new token logo: prefer the in-memory `blob:` preview (survives step
 * navigation until the gateway image loads), otherwise resolve `ipfs://` via Pinata like
 * {@link resolveTokenImageSrc}.
 */
export function resolveCreateNewTokenDisplayImageSrc(
  localImagePreviewUri: string,
  imageUrl: string,
): string | undefined {
  return localImagePreviewUri || resolveTokenImageSrc(imageUrl)
}
