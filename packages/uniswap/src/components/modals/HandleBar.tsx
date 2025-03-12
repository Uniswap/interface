import type { ColorValue, FlexStyle } from 'react-native'
import type { FlexProps } from 'ui/src'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type HandleBarProps = {
  // string instead of keyof Theme['colors] because this is sometimes a raw hex value when used with BottomSheet components
  backgroundColor?: ColorValue
  hidden?: boolean
  containerFlexStyles?: FlexStyle
  indicatorColor?: FlexProps['backgroundColor']
}

export function HandleBar(_: HandleBarProps): JSX.Element {
  throw new PlatformSplitStubError('HandleBar')
}
