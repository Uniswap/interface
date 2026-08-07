import { createIcon } from '../factories/createIcon'

export const [AvatarPlaceholder, AnimatedAvatarPlaceholder] = createIcon({
  name: 'AvatarPlaceholder',
  getIcon: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12.0003" cy="11.9998" r="3.33333" fill="currentColor" />
    </svg>
  ),
  defaultFill: '#131313',
})
