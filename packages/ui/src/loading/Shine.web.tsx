import { useState } from 'react'
import { LayoutRectangle } from 'react-native'
import { Flex } from 'ui/src/components/layout'
import { ShineProps } from 'ui/src/loading/ShineProps'

export function Shine({ children, disabled }: ShineProps): JSX.Element {
  const [layout, setLayout] = useState<LayoutRectangle | null>()

  if (disabled) {
    return children
  }

  if (!layout) {
    return (
      <Flex
        opacity={0}
        onLayout={(event: {
          nativeEvent: { layout: React.SetStateAction<LayoutRectangle | null | undefined> }
        }): void => setLayout(event.nativeEvent.layout)}>
        {children}
      </Flex>
    )
  }

  return (
    <Flex
      height={layout.height}
      style={{
        WebkitMaskImage: `linear-gradient(-75deg, rgba(0,0,0,0.5) 30%, #000 50%, rgba(0,0,0,0.5) 70%)`,
        WebkitMaskSize: '200%',
        animation: 'shine 1s linear infinite',
      }}
      width={layout.width}>
      {children}
    </Flex>
  )
}
