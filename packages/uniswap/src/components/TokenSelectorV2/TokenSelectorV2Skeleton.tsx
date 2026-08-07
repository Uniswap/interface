import { Flex, Loader } from 'ui/src'

// Enough rows to cover the V2 pane height (520px) — excess is clipped by overflow.
const SKELETON_ROW_COUNT = 8

/**
 * Full-height loading skeleton for the V2 selector panes. The shared SelectorBaseList's
 * built-in skeleton renders only 3 rows, which leaves most of the 520px modal blank while
 * loading — V2 overlays this taller one instead (the shared component stays untouched).
 */
export function TokenSelectorV2Skeleton({ rows = SKELETON_ROW_COUNT }: { rows?: number }): JSX.Element {
  return (
    <Flex grow overflow="hidden" px="$spacing12">
      <Loader.Token gap="$none" repeat={rows} />
    </Flex>
  )
}

/** Absolute overlay variant that covers a loading list's own (shorter) skeleton. */
export function TokenSelectorV2SkeletonOverlay({
  backgroundColor = '$surface1',
  rows,
}: {
  backgroundColor?: '$surface1' | '$surface2'
  rows?: number
}): JSX.Element {
  return (
    <Flex
      grow
      backgroundColor={backgroundColor}
      bottom={0}
      left={0}
      pointerEvents="none"
      position="absolute"
      right={0}
      top={0}
    >
      <TokenSelectorV2Skeleton rows={rows} />
    </Flex>
  )
}
