import { I18nManager } from 'react-native'
import { GeneratedIconProps } from 'ui/src/components/factories/createIcon'
import { LeftArrow, RightArrow } from 'ui/src/components/icons'

export function BackArrow(props: GeneratedIconProps): JSX.Element {
  return I18nManager.isRTL ? <RightArrow size="$icon.24" {...props} /> : <LeftArrow size="$icon.24" {...props} />
}
