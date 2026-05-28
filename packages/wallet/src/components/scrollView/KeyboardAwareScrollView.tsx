import { type PropsWithChildren, useState } from 'react'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import {
  KeyboardAwareScrollView as KeyboardControllerScrollView,
  type KeyboardAwareScrollViewProps as KeyboardControllerScrollViewProps,
  KeyboardStickyView,
  type KeyboardStickyViewProps,
} from 'react-native-keyboard-controller'

export type KeyboardAwareScrollViewProps = PropsWithChildren<
  KeyboardControllerScrollViewProps & {
    stickyComponent?: JSX.Element
    bottomExtraOffset?: number
    keyboardStickyViewProps?: Omit<KeyboardStickyViewProps, 'onLayout' | 'offset'>
    stickyComponentKeyboardOpenedOffset?: number
    stickyComponentKeyboardClosedOffset?: number
  }
>

// Keyboard aware scrollview with a sticky component.
// Useful for screens with inputs, it pushes focused input into visible area, on top of the keyboard and sticky component.
// oxlint-disable-next-line typescript/explicit-function-return-type
export function KeyboardAwareScrollView({
  children,
  stickyComponent,
  bottomExtraOffset = 0,
  keyboardStickyViewProps,
  stickyComponentKeyboardOpenedOffset = 0,
  stickyComponentKeyboardClosedOffset = 0,
  ...props
}: KeyboardAwareScrollViewProps) {
  const [stickyBottomInset, setStickyBottomInset] = useState(0)

  return (
    <>
      <NativeViewGestureHandler disallowInterruption>
        <KeyboardControllerScrollView bottomOffset={stickyBottomInset + bottomExtraOffset} {...props}>
          {children}
        </KeyboardControllerScrollView>
      </NativeViewGestureHandler>
      {stickyComponent && (
        <KeyboardStickyView
          offset={{
            opened: stickyComponentKeyboardOpenedOffset,
            closed: stickyComponentKeyboardClosedOffset,
          }}
          onLayout={(e) => setStickyBottomInset(e.nativeEvent.layout.height)}
          {...keyboardStickyViewProps}
        >
          {stickyComponent}
        </KeyboardStickyView>
      )}
    </>
  )
}
