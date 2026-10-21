import { createIcon } from '../factories/createIcon'
import { Path, Svg } from '../factories/svg-elements'

export const [ArrowRightFromBracket, AnimatedArrowRightFromBracket] = createIcon({
  name: 'ArrowRightFromBracket',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H9M16 16L20 12M20 12L16 8M20 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
})
