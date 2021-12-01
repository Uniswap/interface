/*
 * Generates an SVG path for the east brush handle.
 * Apply `scale(-1, 1)` to generate west brush handle.
 *
 *    |```````\
 *    |  | |  |
 *    |______/
 *    |
 *    |
 *    |
 *    |
 *    |
 *
 * https://medium.com/@dennismphil/one-side-rounded-rectangle-using-svg-fb31cf318d90
 */
export const brushHandlePath = (height: number) =>
  [
    // handle
    `M 0 0`, // move to origin
    `v ${height}`, // vertical line
    'm 1 0', // move 1px to the right
    `V 0`, // second vertical line
    `M 0 1`, // move to origin

    // head
    'h 12', // horizontal line
    'q 2 0, 2 2', // rounded corner
    'v 22', // vertical line
    'q 0 2 -2 2', // rounded corner
    'h -12', // horizontal line
    `z`, // close path
  ].join(' ')

export const brushHandleAccentPath = () =>
  [
    'm 5 7', // move to first accent
    'v 14', // vertical line
    'M 0 0', // move to origin
    'm 9 7', // move to second accent
    'v 14', // vertical line
    'z',
  ].join(' ')

export const OffScreenHandle = ({
  color,
  size = 10,
  margin = 10,
}: {
  color: string
  size?: number
  margin?: number
}) => (
  <polygon
    points={`0 0, ${size} ${size}, 0 ${size}`}
    transform={` translate(${size + margin}, ${margin}) rotate(45) `}
    fill={color}
    stroke={color}
    strokeWidth="4"
    strokeLinejoin="round"
  />
)
