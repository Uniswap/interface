import type { SVGProps } from '~/constants/icons/types'

const SEK_ICON = (props: SVGProps) => (
  <svg width="49" height="49" viewBox="0 0 49 49" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip0_sek)">
      <g transform="translate(-14.6875, 0) scale(4.9)">
        <path fill="#005293" d="M0 0H16V10H0Z" />
        <path fill="#FECB00" d="M5 0H7V10H5Z" />
        <path fill="#FECB00" d="M0 4H16V6H0Z" />
      </g>
    </g>
    <defs>
      <clipPath id="clip0_sek">
        <path
          d="M0 24.3184C0 10.8877 10.8877 0 24.3184 0C37.749 0 48.6368 10.8877 48.6368 24.3184C48.6368 37.7491 37.749 48.6368 24.3184 48.6368C10.8877 48.6368 0 37.749 0 24.3184Z"
          fill="white"
        />
      </clipPath>
    </defs>
  </svg>
)

export default SEK_ICON
