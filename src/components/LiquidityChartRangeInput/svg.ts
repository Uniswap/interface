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
    `M 0 ${height}`,
    'L 0 1',

    // head
    'h 7', // horizontal line
    'q 5 0, 5 5', // rounded corner
    'v 18', // vertical line
    'q 0 5 -5 5', // rounded corner
    'h -7', // horizontal line
    `z`, // close path
  ].join(' ')

export const brushHandleAccentPath = () =>
  [
    'm 4 7', // move to first accent
    'v 15', // vertical line
    'M 0 0', // move to origin
    'm 8 7', // move to second accent
    'v 15', // vertical line
    'z',
  ].join(' ')

const LABEL_PADDING = 10
const LABEL_CHAR_WIDTH = 6

export const getTextWidth = (s: string | undefined) =>
  s ? s.split('').length * LABEL_CHAR_WIDTH + LABEL_PADDING * 2 : 0
