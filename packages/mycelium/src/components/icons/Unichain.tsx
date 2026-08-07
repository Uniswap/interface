import { createIcon } from '../factories/createIcon'

export const [Unichain, AnimatedUnichain] = createIcon({
  name: 'Unichain',
  getIcon: (props) => (
    <svg viewBox="0 0 25 25" fill="none" {...props}>
      <path
        d="M24.7441 11.9143C18.2397 11.9143 12.9725 6.6417 12.9725 0.142578H12.5159V11.9143H0.744141V12.3709C7.24858 12.3709 12.5159 17.6435 12.5159 24.1426H12.9725V12.3709H24.7441V11.9143Z"
        fill="currentColor"
      />
    </svg>
  ),
  defaultFill: '#F50DB4',
})
