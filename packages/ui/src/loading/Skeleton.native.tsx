import { Shine } from 'ui/src/loading/Shine'
import { SkeletonProps } from 'ui/src/loading/SkeletonProps'

// Same glare-sweep implementation as Shine (and as Skeleton.web): placeholder children render
// their own fills, the shine sweeps above them. `contrast` is accepted for API compatibility;
// the overlay reads equally against light and dark placeholder fills.
export function Skeleton({ children, disabled }: SkeletonProps): JSX.Element {
  return <Shine disabled={disabled}>{children}</Shine>
}
