import React, { PropsWithChildren, ReactNode } from 'react'
import { View } from 'react-native'

// react-native-masked-view for Storybook web
// https://github.com/react-native-masked-view/masked-view/issues/70#issuecomment-1171801526
function MaskedViewWeb({ maskElement, ...props }: PropsWithChildren<{ maskElement: ReactNode }>) {
  return React.createElement(View, props, maskElement)
}

export default MaskedViewWeb
