import React from 'react'
import useTheme from 'hooks/useTheme'

function History() {
  const theme = useTheme()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20">
      <g fill="none" fillRule="evenodd">
        <g>
          <g>
            <g>
              <path d="M0 0L24 0 24 24 0 24z" transform="translate(-798 -98) translate(789 90) translate(8 6)" />
              <g stroke={theme.subText} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                <path
                  d="M4.5 9L2.25 11.25 0 9M2.25 9c0 .694.086 1.366.235 2.015M20.25 9c0-4.971-4.029-9-9-9s-9 4.029-9 9M11.25 18c4.971 0 9-4.029 9-9M3.879 14.155C5.506 16.478 8.198 18 11.25 18"
                  transform="translate(-798 -98) translate(789 90) translate(8 6) translate(1.875 3)"
                />
                <path
                  d="M14.621 11.871L10.969 9.698 10.969 4.985"
                  transform="translate(-798 -98) translate(789 90) translate(8 6) translate(1.875 3)"
                />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

export default History
