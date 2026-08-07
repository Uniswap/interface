import { createIcon } from '../factories/createIcon'

export const [Dot, AnimatedDot] = createIcon({
  name: 'Dot',
  getIcon: (props) => (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <g id="Dot">
        <circle id="Ellipse 4" cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.08" />
        <circle id="Ellipse 5" cx="8" cy="8" r="2" fill="currentColor" fillOpacity="0.63" />
      </g>
    </svg>
  ),
  defaultFill: '#131313',
})
