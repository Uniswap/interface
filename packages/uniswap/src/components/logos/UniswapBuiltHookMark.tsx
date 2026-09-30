import { Flex } from '@universe/mycelium'
import { UniswapLogo } from '@universe/mycelium/icons/UniswapLogo'
import { LIGHT_THEME_COLORS } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'

// Fixed light chip (#FEF4FF) in both themes on purpose: a translucent accent tint (`$accent2`) washes out
// against the dark badge, so a pinned light tile is what makes the mark read in dark mode. Read from
// mycelium's theme-pinned static map rather than passed as `$pinkLight`: the raw Spore palette sits outside
// the compat colour boundary, so the `$` token only paints through a logged fallback, while a literal is
// the documented theme-invariant lane (same emission, no diagnostic).
const CHIP_BACKGROUND = LIGHT_THEME_COLORS.pinkLight

/**
 * The Uniswap unicorn on a light-pink chip — the provenance mark for hooks Uniswap built or configured,
 * matching the Figma "badge/hook" treatment.
 */
export function UniswapBuiltHookMark(): JSX.Element {
  return (
    <Flex
      testID={TestID.UniswapBuiltHookMark}
      width={16}
      height={16}
      borderRadius="$rounded4"
      backgroundColor={CHIP_BACKGROUND}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <UniswapLogo color="$accent1" size="$icon.12" />
    </Flex>
  )
}
