import { YStack } from 'tamagui'
import { SkeletonProps } from './SkeletonProps'

export function Skeleton({ children, disabled }: SkeletonProps): JSX.Element {
  if (disabled) {
    return children
  }

  return (
    <>
      {children}
      <YStack
        fullscreen
        backgroundColor="$neutral3"
        borderRadius="$rounded16"
        pos="absolute"
        zi={1_000_000}
      />
    </>
  )
}
