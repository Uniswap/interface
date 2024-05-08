import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SelectIcon, AnimatedSelectIcon] = createIcon({
  name: 'SelectIcon',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M7 10C5.343 10 4 8.657 4 7C4 5.343 5.343 4 7 4C8.657 4 10 5.343 10 7C10 8.657 8.657 10 7 10ZM20 7C20 5.343 18.657 4 17 4C15.343 4 14 5.343 14 7C14 8.657 15.343 10 17 10C18.657 10 20 8.657 20 7ZM10 17C10 15.343 8.657 14 7 14C5.343 14 4 15.343 4 17C4 18.657 5.343 20 7 20C8.657 20 10 18.657 10 17ZM20 17C20 15.343 18.657 14 17 14C15.343 14 14 15.343 14 17C14 18.657 15.343 20 17 20C18.657 20 20 18.657 20 17Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
