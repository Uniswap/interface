import React from 'react'

const TwitterIcon = ({ width, height, color }: { width?: number; height?: number; color?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 14} height={height || 12} viewBox="0 0 14 12">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <g>
              <g>
                <g>
                  <path
                    d="M0 0L16 0 16 16 0 16z"
                    transform="translate(-154 -741) translate(19 734) translate(128) translate(6 5) rotate(-90 8 8)"
                  />
                  <path
                    stroke={color || '#1B95CD'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12.8 6.233c0 4.2-2.4 7.2-6.6 7.2-2.4 0-3.362-1.252-4.2-2.4m0 0c.02-.003 1.8-.6 1.8-.6-2.004-2.026-2.156-5.026-.6-7.2.738 1.373 2.116 2.64 3.6 3 .057-1.733 1.233-3 3-3 1.203 0 1.911.459 2.4 1.2H14l-1.2 1.8"
                    transform="translate(-154 -741) translate(19 734) translate(128) translate(6 5)"
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

export default TwitterIcon
