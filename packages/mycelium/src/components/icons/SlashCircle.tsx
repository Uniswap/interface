import { createIcon } from '../factories/createIcon'

export const [SlashCircle, AnimatedSlashCircle] = createIcon({
  name: 'SlashCircle',
  getIcon: (props) => (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <g clipPath="url(#clip0_702_17824)">
        <path
          d="M8.00016 14.6667C11.6821 14.6667 14.6668 11.6819 14.6668 8.00004C14.6668 4.31814 11.6821 1.33337 8.00016 1.33337C4.31826 1.33337 1.3335 4.31814 1.3335 8.00004C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.28662 3.28662L12.7133 12.7133"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_702_17824">
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  ),
})
