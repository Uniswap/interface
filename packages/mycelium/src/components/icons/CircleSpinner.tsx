import { createIcon } from '../factories/createIcon'

export const [CircleSpinner, AnimatedCircleSpinner] = createIcon({
  name: 'CircleSpinner',
  getIcon: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
        stroke="currentColor"
        opacity="0.1"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M21 12C21 7.02944 16.9706 3 12 3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
})
