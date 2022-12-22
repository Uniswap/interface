import React from 'react'

export default function CopyIcon({ size }: { size?: string | number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || '24'} height={size || '24'} viewBox="0 0 24 24" fill="none">
      <g clipPath="url(#clip0_1805_60134)">
        <path
          d="M15 20H5V7C5 6.45 4.55 6 4 6C3.45 6 3 6.45 3 7V20C3 21.1 3.9 22 5 22H15C15.55 22 16 21.55 16 21C16 20.45 15.55 20 15 20ZM20 16V4C20 2.9 19.1 2 18 2H9C7.9 2 7 2.9 7 4V16C7 17.1 7.9 18 9 18H18C19.1 18 20 17.1 20 16ZM18 16H9V4H18V16Z"
          fill="currentcolor"
        />
      </g>
      <defs>
        <clipPath id="clip0_1805_60134">
          <rect width={size || '24'} height={size || '24'} fill="transparent" />
        </clipPath>
      </defs>
    </svg>
  )
}
