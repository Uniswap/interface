import { Flex, Shine } from '@universe/mycelium'
import type { PropsWithChildren } from 'react'

/**
 * A shimmer bar in place of its children while `loading`: the value an indicative quote
 * doesn't have yet. DetailRow `isLoading` already uses it; reach for it directly only for
 * a value outside a DetailRow.
 *
 * @alias Skeleton, LoadingShimmer, ValueSkeleton
 */
export function IndicativeLoadingWrapper({ children, loading }: PropsWithChildren<{ loading?: boolean }>): JSX.Element {
  if (loading) {
    return (
      <Shine>
        <Flex backgroundColor="$surface3" borderRadius={8} height={20} width={60} />
      </Shine>
    )
  }

  return <>{children}</>
}
