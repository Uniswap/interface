/* eslint-disable no-restricted-imports */
import type { ColorValue, FlexStyle } from 'react-native'
import { NotImplementedError } from 'utilities/src/errors'

export type HandleBarProps = {
  // string instead of keyof Theme['colors] because this is sometimes a raw hex value when used with BottomSheet components
  backgroundColor?: ColorValue
  hidden?: boolean
  containerFlexStyles?: FlexStyle
}

export function HandleBar(_: HandleBarProps): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` file.')
}
