// HookSwap: the floating help widget (the bottom-left "?" button that opened a
// "Get help / Docs / Contact us" popover linking to Uniswap support URLs) is
// removed from the product. Kept as a no-op component so existing mount points
// (top-level modal registry, legacy nav) don't break.
export function HelpModal(_props?: { showOnXL?: boolean }): null {
  return null
}

export default HelpModal
