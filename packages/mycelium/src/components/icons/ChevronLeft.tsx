import { createIcon } from '../factories/createIcon'

export const [ChevronLeft, AnimatedChevronLeft] = createIcon({
  name: 'ChevronLeft',
  getIcon: (props) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  ),
})
