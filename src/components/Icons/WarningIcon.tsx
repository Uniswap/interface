import React from 'react'

export default function WarningIcon({ size }: { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || '24'} height={size || '24'} viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.5892 5.52764L19.1147 13.5706C20.2277 15.5521 18.7982 18.0001 16.5242 18.0001H7.47467C5.20217 18.0001 3.77117 15.5536 4.88568 13.5721L9.41118 5.52914C10.5452 3.50714 13.4522 3.50714 14.5892 5.52764Z"
        stroke="currentcolor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.1975V8.47205"
        stroke="currentcolor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9988 14.2035C11.9238 14.2035 11.8638 14.265 11.8653 14.3385C11.8653 14.4135 11.9268 14.4735 12.0003 14.4735C12.0738 14.4735 12.1338 14.412 12.1338 14.3385C12.1338 14.265 12.0738 14.2035 11.9988 14.2035"
        stroke="currentcolor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
