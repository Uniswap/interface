import { useCallback, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { View, type ViewProps } from 'tamagui'

const enterStyle = { opacity: 0 } satisfies ViewProps['enterStyle']
const exitStyle = { opacity: 0 } satisfies ViewProps['exitStyle']

export const WidthAnimator = View.styleable<{ open?: boolean; height: number }>((props) => {
  const { open = true, height, children, ...rest } = props
  const [visibleWidth, setVisibleWidth] = useState(0)

  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    if (nativeEvent.layout.width) {
      setVisibleWidth(nativeEvent.layout.width)
    }
  }, [])

  return (
    // TODO: figure out how to allow dynamic height based on content
    <View
      animation="fast"
      enterStyle={enterStyle}
      exitStyle={exitStyle}
      height={height}
      overflow="hidden"
      width={open ? visibleWidth : 0}
      {...rest}
    >
      <View position="absolute" onLayout={onLayout}>
        {children}
      </View>
    </View>
  )
})
