export default function WarningIcon({ size }: { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || '24'} height={size || '24'} viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.5892 5.52691L19.1147 13.5699C20.2277 15.5514 18.7982 17.9994 16.5242 17.9994H7.47468C5.20217 17.9994 3.77117 15.5529 4.88568 13.5714L9.41118 5.52841C10.5452 3.50641 13.4522 3.50641 14.5892 5.52691Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.1982V8.47266"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9988 14.2029C11.9238 14.2029 11.8638 14.2644 11.8653 14.3379C11.8653 14.4129 11.9268 14.4729 12.0003 14.4729C12.0738 14.4729 12.1338 14.4114 12.1338 14.3379C12.1338 14.2644 12.0738 14.2029 11.9988 14.2029"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
