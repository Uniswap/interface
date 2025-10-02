import 'src/app/components/loading/SkeletonBox.css'

/**
 * Unlike the `ui/src/Skeleton`, this `SkeletonBox` animation does not run in the main thread, so it won't be choppy if the main thread is busy.
 */
export function SkeletonBox({
  width = '100%',
  height,
  borderRadius = '5px',
}: {
  width?: number | string
  height: number | string
  borderRadius?: string
}): JSX.Element {
  // biome-ignore  lint/correctness/noRestrictedElements: needed here
  return <div className="skeleton-box" style={{ width, height, borderRadius }} />
}
