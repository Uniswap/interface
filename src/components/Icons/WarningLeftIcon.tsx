import React from 'react'

const WarningLeftIcon = ({ width, height }: { width?: number; height?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 35} height={height || 34} viewBox="0 0 35 34">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <g>
              <g>
                <path
                  fill="#FFAF01"
                  d="M0 0L33.794 0 0 33z"
                  transform="translate(-266 -303) translate(266 195) translate(0 108) translate(.75 .502)"
                />
                <g>
                  <g>
                    <path
                      d="M0 0L16 0 16 16 0 16z"
                      transform="translate(-266 -303) translate(266 195) translate(0 108) translate(.75 .502) translate(1.25 2.498)"
                    />
                    <path
                      stroke="#323232"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.726 3.685l3.017 5.362c.742 1.321-.211 2.953-1.727 2.953H4.983c-1.515 0-2.469-1.631-1.726-2.952l3.017-5.362c.756-1.348 2.694-1.348 3.452-.001zM8 7.465L8 5.648"
                      transform="translate(-266 -303) translate(266 195) translate(0 108) translate(.75 .502) translate(1.25 2.498)"
                    />
                    <path
                      stroke="#323232"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.999 9.469c-.05 0-.09.041-.089.09 0 .05.041.09.09.09.049 0 .089-.041.089-.09 0-.049-.04-.09-.09-.09"
                      transform="translate(-266 -303) translate(266 195) translate(0 108) translate(.75 .502) translate(1.25 2.498)"
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

export default WarningLeftIcon
