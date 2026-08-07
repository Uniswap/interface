import { createIcon } from '../factories/createIcon'

export const [Hamburger, AnimatedHamburger] = createIcon({
  name: 'Hamburger',
  getIcon: (props) => (
    <svg viewBox="0 0 18 12" fill="none" {...props}>
      <path d="M1.5 6H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.5 1H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.5 11H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
})
