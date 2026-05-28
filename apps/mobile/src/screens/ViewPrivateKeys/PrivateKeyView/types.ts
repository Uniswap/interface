import { StyleProp, ViewStyle } from 'react-native'

export type NativePrivateKeyDisplayProps = {
  address?: string
}

export type NativePrivateKeyDisplayInternalProps = NativePrivateKeyDisplayProps & {
  onHeightMeasured: (e: { nativeEvent: { height: number } }) => void
  style: StyleProp<ViewStyle>
}
