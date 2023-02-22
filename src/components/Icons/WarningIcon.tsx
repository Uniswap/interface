export default function WarningIcon({
  size = '24',
  solid,
  color = 'currentColor',
}: {
  size?: number | string
  solid?: boolean
  color?: string
}) {
  if (solid)
    return (
      <svg
        width={size}
        height={(18 / 20) * Number(size)}
        viewBox="0 0 20 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.47 18.0002H17.53C19.07 18.0002 20.03 16.3302 19.26 15.0002L11.73 1.99018C10.96 0.660176 9.04 0.660176 8.27 1.99018L0.739999 15.0002C-0.0300008 16.3302 0.929999 18.0002 2.47 18.0002V18.0002ZM10 11.0002C9.45 11.0002 9 10.5502 9 10.0002V8.00018C9 7.45018 9.45 7.00018 10 7.00018C10.55 7.00018 11 7.45018 11 8.00018V10.0002C11 10.5502 10.55 11.0002 10 11.0002ZM11 15.0002H9V13.0002H11V15.0002Z"
          fill={color}
        />
      </svg>
    )

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.5892 5.52691L19.1147 13.5699C20.2277 15.5514 18.7982 17.9994 16.5242 17.9994H7.47468C5.20217 17.9994 3.77117 15.5529 4.88568 13.5714L9.41118 5.52841C10.5452 3.50641 13.4522 3.50641 14.5892 5.52691Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 11.1982V8.47266" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M11.9988 14.2029C11.9238 14.2029 11.8638 14.2644 11.8653 14.3379C11.8653 14.4129 11.9268 14.4729 12.0003 14.4729C12.0738 14.4729 12.1338 14.4114 12.1338 14.3379C12.1338 14.2644 12.0738 14.2029 11.9988 14.2029"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
