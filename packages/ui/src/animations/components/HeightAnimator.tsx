import { useState } from 'react'
import { View, useEvent } from 'tamagui'

export const HeightAnimator = View.styleable<{ open?: boolean; useInitialHeight?: boolean }>((props, ref) => {
  const { open = true, children, useInitialHeight, ...rest } = props
  const [visibleHeight, setVisibleHeight] = useState(useInitialHeight ? children.height : 0)

  const onLayout = useEvent(({ nativeEvent }) => {
    if (nativeEvent.layout.height) {
      setVisibleHeight(nativeEvent.layout.height)
    }
  })

  return (
    <View
      ref={ref}
      animation="fast"
      enterStyle={{ opacity: 0 }}
      exitStyle={{ opacity: 0 }}
      height={open ? visibleHeight : 0}
      overflow="hidden"
      width="100%"
      {...rest}
    >
      <View position="absolute" width="100%" onLayout={onLayout}>
        {children}
      </View>
    </View>
  )
})
