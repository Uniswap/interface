export default function CircleInfoIcon({ size = '52' }: { size?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26 2V2C39.256 2 50 12.744 50 26V26C50 39.256 39.256 50 26 50V50C12.744 50 2 39.256 2 26V26C2 12.744 12.744 2 26 2Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.998 15.5C25.722 15.5 25.498 15.724 25.5 16C25.5 16.276 25.724 16.5 26 16.5C26.276 16.5 26.5 16.276 26.5 16C26.5 15.724 26.276 15.5 25.998 15.5"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 37V24H24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
