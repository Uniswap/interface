/**
 * Detects whether the current frame is sandboxed without the `allow-same-origin` flag.
 *
 * Browsers set `window.origin` to the string `"null"` for frames with a `sandbox`
 * attribute that does not include `allow-same-origin`. These frames cannot be trusted
 * because an attacker can embed malicious scripts inside them on trusted domains
 * (e.g., OpenSea NFT embeds) and trigger wallet prompts attributed to the parent domain.
 *
 * See bug bounty finding #621.
 */
export function isSandboxedFrame(): boolean {
  return typeof window !== 'undefined' && window.origin === 'null'
}
