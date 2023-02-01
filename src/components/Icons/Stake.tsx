import { CSSProperties } from 'styled-components'

export default function StakeIcon({ size, style = {} }: { size?: string | number; style?: CSSProperties }) {
  return (
    <svg
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width={size || '16'}
      height={size || '16'}
      viewBox="0 0 16 16"
      fill="none"
    >
      <g clipPath="url(#clip0_736_23105)">
        <path
          d="M11.0602 6H10.0002V2.66667C10.0002 2.3 9.70016 2 9.3335 2H6.66683C6.30016 2 6.00016 2.3 6.00016 2.66667V6H4.94016C4.34683 6 4.04683 6.72 4.46683 7.14L7.52683 10.2C7.78683 10.46 8.20683 10.46 8.46683 10.2L11.5268 7.14C11.9468 6.72 11.6535 6 11.0602 6ZM3.3335 12.6667C3.3335 13.0333 3.6335 13.3333 4.00016 13.3333H12.0002C12.3668 13.3333 12.6668 13.0333 12.6668 12.6667C12.6668 12.3 12.3668 12 12.0002 12H4.00016C3.6335 12 3.3335 12.3 3.3335 12.6667Z"
          fill="currentcolor"
        />
      </g>
      <defs>
        <clipPath id="clip0_736_23105">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
