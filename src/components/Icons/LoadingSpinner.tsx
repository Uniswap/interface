import { useTheme } from 'styled-components/macro'

import { StyledRotatingSVG, StyledSVG } from './shared'

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
  const theme = useTheme()
  return (
    <StyledRotatingSVG
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      size={size}
      stroke={stroke ?? theme.accentActive}
      {...rest}
    >
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375"
        strokeWidth={strokeWidth ?? '2.5'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledRotatingSVG>
  )
}

export function LoaderV2() {
  const theme = useTheme()
  return (
    <StyledRotatingSVG size="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <StyledSVG size="16px" viewBox="0 0 16 16" fill={theme.backgroundOutline} xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 2.66667C5.05448 2.66667 2.66667 5.05448 2.66667 8C2.66667 10.9455 5.05448 13.3333 8 13.3333C10.9455 13.3333 13.3333 10.9455 13.3333 8C13.3333 5.05448 10.9455 2.66667 8 2.66667ZM0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z"
        />
      </StyledSVG>
      <StyledSVG size="16px" viewBox="0 0 16 16" fill={theme.accentAction} xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.66669 1.33333C6.66669 0.596954 7.26364 0 8.00002 0C9.0506 0 10.0909 0.206926 11.0615 0.608964C12.0321 1.011 12.914 1.60028 13.6569 2.34315C14.3997 3.08601 14.989 3.96793 15.3911 4.93853C15.7931 5.90914 16 6.94943 16 8C16 8.73638 15.4031 9.33333 14.6667 9.33333C13.9303 9.33333 13.3334 8.73638 13.3334 8C13.3334 7.29962 13.1954 6.60609 12.9274 5.95902C12.6594 5.31195 12.2665 4.72401 11.7713 4.22876C11.276 3.73352 10.6881 3.34067 10.041 3.07264C9.39393 2.80462 8.7004 2.66667 8.00002 2.66667C7.26364 2.66667 6.66669 2.06971 6.66669 1.33333Z"
        />
      </StyledSVG>
    </StyledRotatingSVG>
  )
}
