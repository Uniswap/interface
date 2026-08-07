import { createIcon } from '../factories/createIcon'

export const [DotLine, AnimatedDotLine] = createIcon({
  name: 'DotLine',
  getIcon: (props) => (
    <svg width="100%" viewBox="850 0 300 200" {...props}>
      <line
        x1="0"
        x2="3000"
        y1="100"
        y2="100"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
        strokeDasharray="1, 45"
      />
    </svg>
  ),
})
