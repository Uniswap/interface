import { useEffect, useState } from 'react'
import { View, useEvent } from 'tamagui'

export const WidthAnimator = View.styleable<{ open?: boolean; height: number }>((props, ref) => {
  const { open = true, height, children, ...rest } = props
  const [width, setWidth] = useState(0)
  const [visibleWidth, setVisibleWidth] = useState(0)

  useEffect(() => {
    if (open) {
      setWidth(visibleWidth)
    } else {
      setWidth(0)
    }
  }, [open, visibleWidth])

  const onLayout = useEvent(({ nativeEvent }) => {
    if (nativeEvent.layout.width) {
      setVisibleWidth(nativeEvent.layout.width)
    }
  })

  return (
    // TODO: figure out how to allow dynamic height based on content
    <View
      ref={ref}
      animation="fast"
      enterStyle={{ opacity: 0 }}
      exitStyle={{ opacity: 0 }}
      height={height}
      overflow="hidden"
      width={width}
      {...rest}
    >
      <View position="absolute" onLayout={onLayout}>
        {children}
      </View>
    </View>
  )
})
