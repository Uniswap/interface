import { useCallback, useEffect, useState } from 'react'
import { View, useEvent } from 'tamagui'

export const WidthAnimator = View.styleable<{ open?: boolean; height: number }>((props, ref) => {
  const { open = true, height, children, ...rest } = props
  const [width, setWidth] = useState(0)
  const [hide, setHide] = useState(false)

  const close = useCallback(() => {
    setWidth(0)
    setTimeout(() => {
      setHide(true)
    }, 300)
  }, [setWidth, setHide])

  useEffect(() => {
    if (open) {
      setHide(false)
    } else {
      close()
    }
  }, [open, setHide, close])

  const onLayout = useEvent(({ nativeEvent }) => {
    if (nativeEvent.layout.width) {
      setWidth(nativeEvent.layout.width)
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
        {!hide && children}
      </View>
    </View>
  )
})
