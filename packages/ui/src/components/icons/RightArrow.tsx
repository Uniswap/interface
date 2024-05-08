import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [RightArrow, AnimatedRightArrow] = createIcon({
  name: 'RightArrow',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 32 32" {...props}>
      <Path
        clipRule="evenodd"
        d="M5.33325 16C5.33325 15.2636 5.93021 14.6666 6.66659 14.6666L22.1143 14.6666L15.0571 7.60944C14.5364 7.08874 14.5364 6.24452 15.0571 5.72382C15.5778 5.20312 16.422 5.20312 16.9427 5.72382L26.2761 15.0572C26.7968 15.5778 26.7968 16.4221 26.2761 16.9428L16.9427 26.2761C16.422 26.7968 15.5778 26.7968 15.0571 26.2761C14.5364 25.7554 14.5364 24.9112 15.0571 24.3905L22.1143 17.3333L6.66659 17.3333C5.93021 17.3333 5.33325 16.7363 5.33325 16Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </Svg>
  ),
})
