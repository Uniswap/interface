import { useCallback, useEffect, useState } from 'react'
import { View, useEvent } from 'tamagui'

export const HeightAnimator = View.styleable<{ open?: boolean }>((props, ref) => {
  const { open = true, children, ...rest } = props
  const [height, setHeight] = useState(0)
  const [hide, setHide] = useState(false)

  const close = useCallback(() => {
    setHeight(0)
    setTimeout(() => {
      setHide(true)
    }, 300)
  }, [setHeight, setHide])

  useEffect(() => {
    if (open) {
      setHide(false)
    } else {
      close()
    }
  }, [open, setHide, close])

  const onLayout = useEvent(({ nativeEvent }) => {
    if (nativeEvent.layout.height) {
      setHeight(nativeEvent.layout.height)
    }
  })

  return (
    <View ref={ref} height={height} {...rest}>
      <View position="absolute" width="100%" onLayout={onLayout}>
        {!hide && children}
      </View>
    </View>
  )
})
