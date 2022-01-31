import { createBox } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { ActionProps, ElementName } from 'src/features/telemetry/constants'
import { TraceEvent } from 'src/features/telemetry/TraceEvent'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const ButtonActionProps = (({ onPress, onLongPress }) => ({ onPress, onLongPress }))(ActionProps)

export const TouchableBox = createBox<Theme, TouchableOpacityProps>(TouchableOpacity)

export type ButtonProps = PropsWithChildren<
  ComponentProps<typeof TouchableBox> & {
    name?: ElementName | string
  }
>

export function Button({ children, name: elementName, ...rest }: ButtonProps) {
  const baseProps = { hitSlop: defaultHitslopInset, ...rest }

  if (!elementName) {
    return <TouchableBox {...baseProps}>{children}</TouchableBox>
  }

  return (
    <TraceEvent actionProps={ButtonActionProps} elementName={elementName} elementType="button">
      <TouchableBox {...baseProps}>{children}</TouchableBox>
    </TraceEvent>
  )
}
