// Handle - straight horizontal line only
export const brushHandlePath = (width: number) =>
  [
    `M 0 0`, // move to origin
    `h ${width}`, // horizontal line with specified width
  ].join(' ')

export const brushHandleAccentPath = (width: number) => {
  const lineStart = width / 2 - 15
  return [
    'M 0 0', // move to origin
    `m ${lineStart} 8`, // move to start of accent line
    `h 30`, // horizontal line
  ].join(' ')
}
/** 
  Points down by default
*/
export const OffScreenHandle = ({ color, size = 6 }: { color: string; size?: number }) => {
  const center = size / 3
  return (
    <polygon
      points={`0 0, ${size} ${size}, 0 ${size}`}
      transform={`translate(${center}, ${center}) rotate(-45) translate(-${center}, -${center})`}
      fill={color}
      stroke={color}
      strokeWidth="4"
      strokeLinejoin="round"
    />
  )
}
