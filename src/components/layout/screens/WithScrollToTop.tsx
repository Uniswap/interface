import React, { forwardRef, PropsWithChildren } from 'react'
import { Pressable } from 'react-native'

export const WithScrollToTop = forwardRef<any, PropsWithChildren<{}>>(
  ({ children }: PropsWithChildren<{}>, ref) => {
    const onPress = () => {
      if (!ref || typeof ref === 'function') return
      ref.current.scrollToOffset({ animated: true, offset: 0 })
    }

    return <Pressable onPress={onPress}>{children}</Pressable>
  }
)
