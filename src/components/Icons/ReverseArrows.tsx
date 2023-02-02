export default function ReverseArrows({ size }: { size?: number | string }) {
  return (
    <svg width={size || '16'} height={size || '16'} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1650_38177)">
        <path
          d="M4.66 7.33331L2 9.99998L4.66 12.6666V10.6666H9.33333V9.33331H4.66V7.33331ZM14 5.99998L11.34 3.33331V5.33331H6.66667V6.66665H11.34V8.66665L14 5.99998Z"
          fill="currentcolor"
        />
      </g>
      <defs>
        <clipPath id="clip0_1650_38177">
          <rect width={size || '16'} height={size || '16'} rx="8" fill="currentcolor" />
        </clipPath>
      </defs>
    </svg>
  )
}
