import React, { PropsWithChildren } from 'react'
import { Pressable } from 'react-native'
import { config } from 'uniswap/src/config'

type WithScrollToTopProps = PropsWithChildren

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WithScrollToTop = React.forwardRef<any, WithScrollToTopProps>(({ children }, ref): JSX.Element => {
  const onPress = (): void => {
    if (typeof ref === 'function' || !ref?.current?.scrollToOffset) {
      return
    }

    ref.current.scrollToOffset({ animated: true, offset: 0 })
  }

  // In E2E test mode, don't wrap in Pressable to allow Maestro to access child testIDs
  if (config.isE2ETest) {
    return <>{children}</>
  }

  return <Pressable onPress={onPress}>{children}</Pressable>
})
