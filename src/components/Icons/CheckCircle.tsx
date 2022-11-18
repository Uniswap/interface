type Props = {
  className?: string
  size?: string
  color?: string
}
const CheckCircle: React.FC<Props> = ({ size = '10', className, color }) => {
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
        d="M5 0C2.24 0 0 2.24 0 5C0 7.76 2.24 10 5 10C7.76 10 10 7.76 10 5C10 2.24 7.76 0 5 0ZM3.645 7.145L1.85 5.35C1.655 5.155 1.655 4.84 1.85 4.645C2.045 4.45 2.36 4.45 2.555 4.645L4 6.085L7.44 2.645C7.635 2.45 7.95 2.45 8.145 2.645C8.34 2.84 8.34 3.155 8.145 3.35L4.35 7.145C4.16 7.34 3.84 7.34 3.645 7.145Z"
        fill={color || 'currentColor'}
      />
    </svg>
  )
}

export default CheckCircle
