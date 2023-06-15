import { SVGProps } from 'react'
import { iconSizes } from 'ui/src/theme/iconSizes'

// TODO(EXT-139): replace with reusable Icon component
export const CheckmarkIcon = ({
  height = iconSizes.icon20,
  width = iconSizes.icon20,
  color,
  ...rest
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
SVGProps<any>): JSX.Element => {
  return (
    <svg fill={color} height={height} viewBox="0 0 24 25" width={width} {...rest}>
      <path
        d="M8.99978 18.5C8.99878 18.5 8.99778 18.5 8.99578 18.5C8.72878 18.499 8.47477 18.392 8.28777 18.202L4.28778 14.14C3.89978 13.746 3.90478 13.113 4.29878 12.726C4.69278 12.339 5.32478 12.343 5.71278 12.737L9.00577 16.081L18.2938 6.79398C18.6848 6.40298 19.3168 6.40298 19.7078 6.79398C20.0988 7.18398 20.0988 7.81798 19.7078 8.20798L9.70777 18.208C9.51977 18.395 9.26478 18.5 8.99978 18.5Z"
        fill={color}
      />
      <path
        d="M8.99978 18.5C8.99878 18.5 8.99778 18.5 8.99578 18.5C8.72878 18.499 8.47477 18.392 8.28777 18.202L4.28778 14.14C3.89978 13.746 3.90478 13.113 4.29878 12.726C4.69278 12.339 5.32478 12.343 5.71278 12.737L9.00577 16.081L18.2938 6.79398C18.6848 6.40298 19.3168 6.40298 19.7078 6.79398C20.0988 7.18398 20.0988 7.81798 19.7078 8.20798L9.70777 18.208C9.51977 18.395 9.26478 18.5 8.99978 18.5Z"
        fill={color}
      />
    </svg>
  )
}
