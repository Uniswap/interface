import { createIcon } from '../factories/createIcon'

export const [Windows, AnimatedWindows] = createIcon({
  name: 'Windows',
  getIcon: (props) => (
    <svg viewBox="0 0 28 28" fill="none" {...props}>
      <g id="Windows">
        <path
          id="Vector"
          d="M3.5 3.5H13.4551V13.4508H3.5V3.5ZM14.5449 3.5H24.5V13.4508H14.5449V3.5ZM3.5 14.5449H13.4551V24.5H3.5V14.5449ZM14.5449 14.5449H24.5V24.5H14.5449"
          fill="currentColor"
        />
      </g>
    </svg>
  ),
  defaultFill: '#222222',
})
