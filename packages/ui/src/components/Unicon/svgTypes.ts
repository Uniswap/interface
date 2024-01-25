import { FillType, PathDef, SkEnum } from '@shopify/react-native-skia'

export interface PathProps {
  path: PathDef
  fillType?: SkEnum<typeof FillType>
}
