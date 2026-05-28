import { Circle, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AvatarPlaceholder, AnimatedAvatarPlaceholder] = createIcon({
  name: 'AvatarPlaceholder',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="12.0003" cy="11.9998" r="3.33333" fill="currentColor" />
    </Svg>
  ),
  defaultFill: '#131313',
})
