import { useTheme } from 'styled-components/macro'

import { GifLoaderWrapper, StyledRotatingSVG } from './shared'

export function LoaderGif({
  size = '16px',
  stroke,
  strokeWidth,
  gif,
  ...rest
}: {
  size?: string
  stroke?: string
  strokeWidth?: number
  gif?: string
  [k: string]: any
}) {
  const theme = useTheme()

  if (gif) {
    return (
      <GifLoaderWrapper size={size} {...rest}>
        <img src={gif} alt="Loading gif" />
      </GifLoaderWrapper>
    )
  }

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
