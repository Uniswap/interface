import { useState } from 'react'
import { View, useEvent } from 'tamagui'
import { FlexProps } from 'ui/src/components/layout'

export interface HeightAnimatorProps {
  open?: boolean
  useInitialHeight?: boolean
  animation?: FlexProps['animation']
  styleProps?: FlexProps
  animationDisabled?: boolean // we want to disable animation when inside of a bottom sheet
}

export const HeightAnimator = View.styleable<HeightAnimatorProps>(
  ({ open = true, animationDisabled = false, children, useInitialHeight, animation = 'fast', styleProps }, ref) => {
    const [visibleHeight, setVisibleHeight] = useState(useInitialHeight ? children.height : 0)

    const onLayout = useEvent(({ nativeEvent }) => {
      if (nativeEvent.layout.height) {
        setVisibleHeight(nativeEvent.layout.height)
      }
    })

    if (animationDisabled) {
      return open ? <>{children}</> : <></>
    }

    return (
      <View
        ref={ref}
        animation={animation}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        height={open ? visibleHeight : 0}
        overflow="hidden"
        width="100%"
        {...styleProps}
      >
        <View position="absolute" width="100%" onLayout={onLayout}>
          {children}
        </View>
      </View>
    )
  },
)
