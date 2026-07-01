import { Path, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Droplet, AnimatedDroplet] = createIcon({
  name: 'Droplet',
  getIcon: (props) => (
    <Svg viewBox="-2 0 19 19" fill="none" {...props}>
      <Path
        d="M15 11.5C15 15.635 11.636 19 7.5 19C3.364 19 0 15.635 0 11.5C0 5.31401 6.915 0.303 7.209 0.093C7.383 -0.031 7.61599 -0.031 7.78999 0.093C8.08499 0.303 15 5.31401 15 11.5Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
