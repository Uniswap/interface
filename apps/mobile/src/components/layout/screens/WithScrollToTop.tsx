import React, { forwardRef, PropsWithChildren } from 'react'
import { Pressable } from 'react-native'

// accept any ref
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WithScrollToTop = forwardRef<any, PropsWithChildren<unknown>>(
  function _WithScrollToTop({ children }: PropsWithChildren<unknown>, ref) {
    const onPress = (): void => {
      if (!ref || typeof ref === 'function') {
        return
      }
      ref.current.scrollToOffset({ animated: true, offset: 0 })
    }

    return <Pressable onPress={onPress}>{children}</Pressable>
  }
)
