import React from 'react'
import useTheme from 'hooks/useTheme'

const AddCircle = ({ width, height }: { width?: number; height?: number }) => {
  const theme = useTheme()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 20} height={height || 20} viewBox="0 0 20 20">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <g>
              <g>
                <g>
                  <path
                    d="M0 0L24 0 24 24 0 24z"
                    transform="translate(-1128 -265) translate(266 195) translate(.75 52) translate(859.25 16)"
                  />
                  <path
                    stroke={theme.primary}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 8L12 16M16 12L8 12M12 21h0c-4.971 0-9-4.029-9-9h0c0-4.971 4.029-9 9-9h0c4.971 0 9 4.029 9 9h0c0 4.971-4.029 9-9 9z"
                    transform="translate(-1128 -265) translate(266 195) translate(.75 52) translate(859.25 16)"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

export default AddCircle
