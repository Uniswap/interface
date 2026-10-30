import { Shine, View, type ViewCompatProps as ViewProps, useSporeColors } from '@universe/mycelium'
import { lighten } from 'polished'
import { createContext, useContext } from 'react'
/** When true, LoadingBubbles render as static skeletons (no shine). E.g. a table's error state. */
export const StaticSkeletonContext = createContext(false)

interface LoadingBubbleProps {
  delay?: string
  round?: boolean
  height?: ViewProps['height']
  width?: ViewProps['width']
  // Lands on an outer View that the shimmer fills; justifyContent also positions the bubble inside it.
  containerProps?: ViewProps
  skeletonProps?: ViewProps
}

export const LoadingBubble = ({
  delay,
  round,
  height = '$spacing24',
  width = '50%',
  containerProps,
  skeletonProps,
}: LoadingBubbleProps) => {
  const colors = useSporeColors()
  const isStatic = useContext(StaticSkeletonContext)

  const { justifyContent, ...outerProps } = containerProps ?? {}

  return (
    <View flexDirection="row" width="100%" {...outerProps}>
      <Shine
        disabled={isStatic}
        flexDirection="row"
        width="100%"
        // Shimmer's union has no 'unset', which is the default anyway.
        justifyContent={justifyContent === 'unset' ? undefined : justifyContent}
        animationDelay={delay}
      >
        <View
          borderRadius={round ? '$roundedFull' : '$rounded12'}
          height={height}
          width={width}
          $platform-web={{
            background: `linear-gradient(to left, ${colors.surface3.val} 25%, ${lighten(0.075, colors.surface3.val)} 50%, ${colors.surface3.val} 75%)`,
          }}
          {...skeletonProps}
        />
      </Shine>
    </View>
  )
}
