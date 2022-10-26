import { createBox } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { withAnimated } from 'src/components/animated'
import { ActionProps, ElementName } from 'src/features/telemetry/constants'
import { TraceEvent } from 'src/features/telemetry/TraceEvent'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const TouchableAreaActionProps = (({ onPress, onLongPress }) => ({ onPress, onLongPress }))(
  ActionProps
)

export const TouchableBox = createBox<Theme, TouchableOpacityProps>(TouchableOpacity)

export type BaseButtonProps = PropsWithChildren<
  ComponentProps<typeof TouchableBox> & {
    name?: ElementName | string
  }
>

export function TouchableArea({ children, name: elementName, ...rest }: BaseButtonProps) {
  const baseProps = { hitSlop: defaultHitslopInset, ...rest }

  if (!elementName) {
    return <TouchableBox {...baseProps}>{children}</TouchableBox>
  }

  return (
    <TraceEvent
      actionProps={TouchableAreaActionProps}
      elementName={elementName}
      elementType="button">
      <TouchableBox {...baseProps}>{children}</TouchableBox>
    </TraceEvent>
  )
}

export const AnimatedTouchableArea = withAnimated(TouchableArea)
