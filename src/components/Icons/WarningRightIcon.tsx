import React from 'react'

const WarningRightIcon = ({ width, height }: { width?: number; height?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 34} height={height || 33} viewBox="0 0 34 33">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <path
              fill="#FFAF01"
              d="M8 0h25.794L0 33V8c0-4.418 3.582-8 8-8z"
              transform="translate(-896 -279) translate(896 279) matrix(-1 0 0 1 33.794 0)"
            />
            <g>
              <g>
                <path
                  d="M0 0L16 0 16 16 0 16z"
                  transform="translate(-896 -279) translate(896 279) translate(15.25 2.498)"
                />
                <path
                  stroke="#323232"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.726 3.685l3.017 5.362c.742 1.321-.211 2.953-1.727 2.953H4.983c-1.515 0-2.469-1.631-1.726-2.952l3.017-5.362c.756-1.348 2.694-1.348 3.452-.001zM8 7.465L8 5.648"
                  transform="translate(-896 -279) translate(896 279) translate(15.25 2.498)"
                />
                <path
                  stroke="#323232"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.999 9.469c-.05 0-.09.041-.089.09 0 .05.041.09.09.09.049 0 .089-.041.089-.09 0-.049-.04-.09-.09-.09"
                  transform="translate(-896 -279) translate(896 279) translate(15.25 2.498)"
                />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

export default WarningRightIcon
