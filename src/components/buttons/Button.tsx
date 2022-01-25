import { createBox } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { Pressable, PressableProps } from 'react-native'
import { ActionProps, ElementName } from 'src/features/telemetry/constants'
import { TraceEvent } from 'src/features/telemetry/TraceEvent'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const ButtonActionProps = (({ onPress, onLongPress }) => ({ onPress, onLongPress }))(ActionProps)

export const PressableBox = createBox<Theme, PressableProps>(Pressable)

export type ButtonProps = ComponentProps<typeof PressableBox> & {
  name?: ElementName | string
}

export function Button({ children, name: elementName, ...rest }: PropsWithChildren<ButtonProps>) {
  const baseProps = { hitSlop: defaultHitslopInset, ...rest }

  if (!elementName) {
    return <PressableBox {...baseProps}>{children}</PressableBox>
  }

  return (
    <TraceEvent actionProps={ButtonActionProps} elementName={elementName} elementType="button">
      <PressableBox {...baseProps}>{children}</PressableBox>
    </TraceEvent>
  )
}
