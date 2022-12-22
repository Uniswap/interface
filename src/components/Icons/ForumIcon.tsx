import React from 'react'

export default function ForumIcon({ size }: { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || '20'} height={size || '20'} viewBox="0 0 20 20" fill="none">
      <g clipPath="url(#clip0_943_7035)">
        <path
          d="M16.6665 4.99935H15.8332V11.666C15.8332 12.1243 15.4582 12.4993 14.9998 12.4993H4.99984V13.3327C4.99984 14.2493 5.74984 14.9993 6.6665 14.9993H14.9998L18.3332 18.3327V6.66602C18.3332 5.74935 17.5832 4.99935 16.6665 4.99935ZM14.1665 9.16602V3.33268C14.1665 2.41602 13.4165 1.66602 12.4998 1.66602H3.33317C2.4165 1.66602 1.6665 2.41602 1.6665 3.33268V14.166L4.99984 10.8327H12.4998C13.4165 10.8327 14.1665 10.0827 14.1665 9.16602Z"
          fill="currentcolor"
        />
      </g>
      <defs>
        <clipPath id="clip0_943_7035">
          <rect width={size || '20'} height={size || '20'} fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
