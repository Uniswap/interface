type SVGProps = React.SVGProps<SVGSVGElement> & {
  fill?: string
  height?: string | number
  width?: string | number
  gradientId?: string
}

export const ClosedCircle = (props: SVGProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
    <g clipPath="url(#clip0_2958_135280)">
      <path
        d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
        stroke="#9B9B9B"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2.46484 2.46509L9.53484 9.53509" stroke="#9B9B9B" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_2958_135280">
        <rect width="12" height="12" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

export const DoubleArrow = (props: SVGProps) => (
  <svg width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4.00284 8.5L0.184659 4.68182L4.00284 0.863636L4.65909 1.51136L1.95739 4.21307H12.1335L9.43182 1.51136L10.0881 0.863636L13.9062 4.68182L10.0881 8.5L9.43182 7.84375L12.1335 5.15057H1.95739L4.65909 7.84375L4.00284 8.5Z"
      fill="#5E5E5E"
    />
  </svg>
)
