import { G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowUpRight, AnimatedArrowUpRight] = createIcon({
  name: 'ArrowUpRight',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <G id="arrow">
        <Path
          id="Vector"
          d="M5.24408 14.7559C5.56951 15.0814 6.09715 15.0814 6.42259 14.7559L13.3333 7.84518V14.1667C13.3333 14.6269 13.7064 15 14.1667 15C14.6269 15 15 14.6269 15 14.1667V5.83333C15 5.3731 14.6269 5 14.1667 5H5.83333C5.3731 5 5 5.3731 5 5.83333C5 6.29357 5.3731 6.66667 5.83333 6.66667H12.1548L5.24408 13.5774C4.91864 13.9028 4.91864 14.4305 5.24408 14.7559Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </G>
    </Svg>
  ),
  defaultFill: '#7D7D7D',
})
