import { StyledRotatingSVG, StyledSVG } from 'components/Icons/shared'
import { useSporeColors } from 'ui/src'

/**
 * Takes in custom size and stroke for circle color, default to primary color as fill,
 * need ...rest for layered styles on top
 */
export default function Loader({
  size = '16px',
  stroke,
  strokeWidth,
  ...rest
}: {
  size?: string
  stroke?: string
  strokeWidth?: number
  [k: string]: any
}) {
  const colors = useSporeColors()
  return (
    <StyledRotatingSVG
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      size={size}
      stroke={stroke ?? colors.accent1.val}
      {...rest}
    >
      <path
        d="M2,12 a10,10 0 0,1 10,-10 M12,22 a10,10 0 0,1 -10,-10 M22,12 a10,10 0 0,1 -10,10"
        strokeWidth={strokeWidth ?? '2.5'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledRotatingSVG>
  )
}

export function LoaderV2() {
  const colors = useSporeColors()
  return (
    <StyledRotatingSVG size="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <StyledSVG size="16px" viewBox="0 0 16 16" fill={colors.surface3.val} xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 2.66667C5.05448 2.66667 2.66667 5.05448 2.66667 8C2.66667 10.9455 5.05448 13.3333 8 13.3333C10.9455 13.3333 13.3333 10.9455 13.3333 8C13.3333 5.05448 10.9455 2.66667 8 2.66667ZM0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z"
        />
      </StyledSVG>
      <StyledSVG size="16px" viewBox="0 0 16 16" fill={colors.accent1.val} xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.66669 1.33333C6.66669 0.596954 7.26364 0 8.00002 0C9.0506 0 10.0909 0.206926 11.0615 0.608964C12.0321 1.011 12.914 1.60028 13.6569 2.34315C14.3997 3.08601 14.989 3.96793 15.3911 4.93853C15.7931 5.90914 16 6.94943 16 8C16 8.73638 15.4031 9.33333 14.6667 9.33333C13.9303 9.33333 13.3334 8.73638 13.3334 8C13.3334 7.29962 13.1954 6.60609 12.9274 5.95902C12.6594 5.31195 12.2665 4.72401 11.7713 4.22876C11.276 3.73352 10.6881 3.34067 10.041 3.07264C9.39393 2.80462 8.7004 2.66667 8.00002 2.66667C7.26364 2.66667 6.66669 2.06971 6.66669 1.33333Z"
        />
      </StyledSVG>
    </StyledRotatingSVG>
  )
}

export function LoaderV3({ size = '16px', color, ...rest }: { size?: string; color?: string; [k: string]: any }) {
  const colors = useSporeColors()
  return (
    <StyledRotatingSVG
      size={size}
      viewBox="0 0 54 54"
      xmlns="http://www.w3.org/2000/svg"
      fill={color ?? colors.neutral3.val}
      stroke={color ?? colors.neutral3.val}
      {...rest}
    >
      <path
        opacity="0.1"
        d="M53.6666 26.9999C53.6666 41.7275 41.7276 53.6666 27 53.6666C12.2724 53.6666 0.333313 41.7275 0.333313 26.9999C0.333313 12.2723 12.2724 0.333252 27 0.333252C41.7276 0.333252 53.6666 12.2723 53.6666 26.9999ZM8.33331 26.9999C8.33331 37.3092 16.6907 45.6666 27 45.6666C37.3093 45.6666 45.6666 37.3092 45.6666 26.9999C45.6666 16.6906 37.3093 8.33325 27 8.33325C16.6907 8.33325 8.33331 16.6906 8.33331 26.9999Z"
        fill={color ?? colors.neutral3.val}
      />
      <path
        d="M49.6666 26.9999C51.8758 26.9999 53.6973 25.1992 53.3672 23.0149C53.0452 20.884 52.4652 18.7951 51.6368 16.795C50.2966 13.5597 48.3324 10.62 45.8562 8.14374C43.3799 5.66751 40.4402 3.70326 37.2049 2.36313C35.2048 1.53466 33.1159 0.954747 30.985 0.632693C28.8007 0.30256 27 2.12411 27 4.33325C27 6.54239 28.8108 8.29042 30.9695 8.76019C32.0523 8.99585 33.1146 9.32804 34.1434 9.75417C36.4081 10.6923 38.4659 12.0672 40.1993 13.8006C41.9327 15.534 43.3076 17.5918 44.2457 19.8565C44.6719 20.8853 45.004 21.9476 45.2397 23.0304C45.7095 25.1891 47.4575 26.9999 49.6666 26.9999Z"
        fill={color ?? colors.neutral3.val}
      />
    </StyledRotatingSVG>
  )
}
