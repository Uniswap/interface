import React from 'react'
import useTheme from 'hooks/useTheme'

const DropIcon = ({ width, height }: { width?: number; height?: number }) => {
  const theme = useTheme()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 35} height={height || 34} viewBox="0 0 35 34">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <g>
              <g>
                <path
                  fill={theme.primary}
                  d="M0 0L33.794 0 0 33z"
                  transform="translate(-148.000000, -373.000000) translate(148.000000, 232.000000) translate(0.749921, 141.501959) translate(-0.000000, 0.000000)"
                />
                <g>
                  <path
                    d="M0 0L16 0 16 16 0 16z"
                    transform="translate(-148.000000, -373.000000) translate(148.000000, 232.000000) translate(0.749921, 141.501959) translate(-0.000000, 0.000000) translate(1.250079, 3.498041)"
                  />
                  <g stroke={theme.textReverse} strokeLinecap="round" strokeLinejoin="round">
                    <path
                      d="M7.543 3.124c1.725 1.725 1.725 4.523 0 6.249s-4.523 1.725-6.249 0c-1.726-1.726-1.725-4.523 0-6.249M1.292 3.127L4.419 0M7.546 3.127L4.419 0"
                      transform="translate(-148.000000, -373.000000) translate(148.000000, 232.000000) translate(0.749921, 141.501959) translate(-0.000000, 0.000000) translate(1.250079, 3.498041) translate(3.581083, 2.666667)"
                    />
                    <path
                      d="M6.176 4.09c.97.971.97 2.545 0 3.515-.97.971-2.544.97-3.515 0-.97-.97-.97-2.543 0-3.514M2.66 4.092L4.419 2.333M6.177 4.092L4.419 2.333"
                      transform="translate(-148.000000, -373.000000) translate(148.000000, 232.000000) translate(0.749921, 141.501959) translate(-0.000000, 0.000000) translate(1.250079, 3.498041) translate(3.581083, 2.666667)"
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

export default DropIcon
