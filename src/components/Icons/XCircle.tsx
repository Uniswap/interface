type Props = {
  className?: string
  size?: string
}
const XCircle: React.FC<Props> = ({ size = '10', className }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 0C2.235 0 0 2.235 0 5C0 7.765 2.235 10 5 10C7.765 10 10 7.765 10 5C10 2.235 7.765 0 5 0ZM7.15 7.15C6.955 7.345 6.64 7.345 6.445 7.15L5 5.705L3.555 7.15C3.36 7.345 3.045 7.345 2.85 7.15C2.655 6.955 2.655 6.64 2.85 6.445L4.295 5L2.85 3.555C2.655 3.36 2.655 3.045 2.85 2.85C3.045 2.655 3.36 2.655 3.555 2.85L5 4.295L6.445 2.85C6.64 2.655 6.955 2.655 7.15 2.85C7.345 3.045 7.345 3.36 7.15 3.555L5.705 5L7.15 6.445C7.34 6.635 7.34 6.955 7.15 7.15Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default XCircle
