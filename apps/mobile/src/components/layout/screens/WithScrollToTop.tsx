import React, { PropsWithChildren } from 'react'
import { Pressable } from 'react-native'
import { getConfig } from 'src/config'

type WithScrollToTopProps = PropsWithChildren

// accept any ref
// oxlint-disable-next-line typescript/no-explicit-any, react/display-name -- Component needs to accept refs from various list types
export const WithScrollToTop = React.forwardRef<any, WithScrollToTopProps>(({ children }, ref): JSX.Element => {
  const onPress = (): void => {
    if (typeof ref === 'function' || !ref?.current?.scrollToOffset) {
      return
    }

    ref.current.scrollToOffset({ animated: true, offset: 0 })
  }

  // In E2E test mode, don't wrap in Pressable to allow Maestro to access child testIDs
  if (getConfig().isE2ETest) {
    return <>{children}</>
  }

  return <Pressable onPress={onPress}>{children}</Pressable>
})
