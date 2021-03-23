import React from 'react'

const GlobeIcon = ({ width, height }: { width?: number; height?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 14} height={height || 14} viewBox="0 0 14 14">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <g>
              <g>
                <g>
                  <g stroke="#859AA5" strokeLinecap="round" strokeLinejoin="round">
                    <path
                      d="M6 0c3.321 0 6 2.679 6 6s-2.679 6-6 6M6 12c-3.321 0-6-2.679-6-6s2.679-6 6-6"
                      transform="translate(-91 -739) translate(19 734) translate(64) translate(7 4) translate(2 2)"
                    />
                    <path
                      d="M4.779.707c-1.927 3.216-1.927 7.37 0 10.587.564.942 1.879.942 2.443 0 1.927-3.217 1.927-7.37 0-10.587-.565-.942-1.88-.942-2.443 0zM0 6L12 6"
                      transform="translate(-91 -739) translate(19 734) translate(64) translate(7 4) translate(2 2)"
                    />
                  </g>
                  <path
                    d="M0 0L16 0 16 16 0 16z"
                    transform="translate(-91 -739) translate(19 734) translate(64) translate(7 4)"
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

export default GlobeIcon
