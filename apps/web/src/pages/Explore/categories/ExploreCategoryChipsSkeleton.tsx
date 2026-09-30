import { Flex } from '@universe/mycelium'
import { LoadingBubble } from '~/components/Tokens/loading'

/** Approximate rendered widths of the default chip row (All + spotlit head), then the More chip. */
const CHIP_SKELETON_WIDTHS = [72, 96, 88, 120, 80]
const MORE_CHIP_SKELETON_WIDTH = 88
/** FilterChip's fixed height, so the row doesn't shift when the chips land. */
const CHIP_HEIGHT = '$spacing36'

function ChipSkeleton({ width }: { width: number }): JSX.Element {
  return <LoadingBubble round height={CHIP_HEIGHT} width={width} containerProps={{ width, flexShrink: 0 }} />
}

/** Placeholder for the Explore category chip row while the category set is still unknown. */
export function ExploreCategoryChipsSkeleton(): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing4">
      {CHIP_SKELETON_WIDTHS.map((width, index) => (
        <ChipSkeleton key={index} width={width} />
      ))}
      <Flex height="$spacing16" width={1} backgroundColor="$surface3" flexShrink={0} />
      <ChipSkeleton width={MORE_CHIP_SKELETON_WIDTH} />
    </Flex>
  )
}
