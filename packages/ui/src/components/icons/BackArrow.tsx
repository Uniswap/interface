import { I18nManager } from 'react-native'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { LeftArrow } from 'ui/src/components/icons/LeftArrow'
import { RightArrow } from 'ui/src/components/icons/RightArrow'

export function BackArrow(props: IconProps): JSX.Element {
  return I18nManager.isRTL ? (
    <RightArrow size="$icon.24" {...props} />
  ) : (
    <LeftArrow size="$icon.24" {...props} />
  )
}
