import { createIcon } from '../factories/createIcon'

export const [EmptySpinner, AnimatedEmptySpinner] = createIcon({
  name: 'EmptySpinner',
  getIcon: (props) => (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity="0.24" strokeWidth="3" />
    </svg>
  ),
})
