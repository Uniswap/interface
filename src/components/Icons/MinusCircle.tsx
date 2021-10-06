import React from 'react'

const MinusCircle = ({ width, height }: { width?: number; height?: number }) => {
  return (
    <svg width={width || 24} height={height || 24} viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <g id="Platform" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="XYZ_Pool" transform="translate(-1160.000000, -415.000000)">
          <g id="Group-9" transform="translate(190.000000, 260.000000)">
            <g id="Group-10" transform="translate(1.000000, 89.000000)">
              <g id="Group-8" transform="translate(0.000000, 52.000000)">
                <g id="Group-Copy-10" transform="translate(969.000000, 14.000000)">
                  <polygon id="Path" points="0 0 24.0000001 0 24.0000001 24.0000001 0 24.0000001"></polygon>
                  <line
                    x1="16.0000001"
                    y1="12"
                    x2="8.00000003"
                    y2="12"
                    id="Path"
                    stroke="#08A1E7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></line>
                  <path
                    d="M12,21 L12,21 C7.02900003,21 3.00000001,16.9710001 3.00000001,12 L3.00000001,12 C3.00000001,7.02900003 7.02900003,3.00000001 12,3.00000001 L12,3.00000001 C16.9710001,3.00000001 21,7.02900003 21,12 L21,12 C21,16.9710001 16.9710001,21 12,21 Z"
                    id="Path"
                    stroke="#08A1E7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

export default MinusCircle
