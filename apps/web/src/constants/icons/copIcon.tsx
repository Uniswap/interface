import { SVGProps } from 'constants/icons/types'

const COP_ICON = (props: SVGProps) => {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#clip0_2407_976)">
        <path fillRule="evenodd" clipRule="evenodd" d="M0.5 0.5H49.5V49.5H0.5V0.5Z" fill="#FFE800" />
        <path fillRule="evenodd" clipRule="evenodd" d="M0.5 25H49.5V49.5H0.5V25Z" fill="#00148E" />
        <path fillRule="evenodd" clipRule="evenodd" d="M0.5 37.25H49.5V49.5H0.5V37.25Z" fill="#DA0010" />
      </g>
      <defs>
        <clipPath id="clip0_2407_976">
          <path
            d="M0.5 25C0.5 11.469 11.469 0.5 25 0.5V0.5C38.531 0.5 49.5 11.469 49.5 25V25C49.5 38.531 38.531 49.5 25 49.5V49.5C11.469 49.5 0.5 38.531 0.5 25V25Z"
            fill="white"
          />
        </clipPath>
      </defs>
    </svg>
  )
}

export default COP_ICON
