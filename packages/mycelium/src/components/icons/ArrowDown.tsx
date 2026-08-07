import { createIcon } from '../factories/createIcon'

export const [ArrowDown, AnimatedArrowDown] = createIcon({
  name: 'ArrowDown',
  getIcon: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
})
