/* Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/helpers/ */

interface BitmapPositionLength {
  /** coordinate for use with a bitmap rendering scope */
  position: number
  /** length for use with a bitmap rendering scope */
  length: number
}

/**
 * Determines the bitmap position and length for a dimension of a shape to be drawn.
 * @param position1Media - media coordinate for the first point
 * @param position2Media - media coordinate for the second point
 * @param pixelRatio - pixel ratio for the corresponding axis (vertical or horizontal)
 * @returns Position of of the start point and length dimension.
 */
export function positionsBox(position1Media: number, position2Media: number, pixelRatio: number): BitmapPositionLength {
  const scaledPosition1 = Math.round(pixelRatio * position1Media)
  const scaledPosition2 = Math.round(pixelRatio * position2Media)
  return {
    position: Math.min(scaledPosition1, scaledPosition2),
    length: Math.abs(scaledPosition2 - scaledPosition1) + 1,
  }
}

const alignToMinimalWidthLimit = 4
const showSpacingMinimalBarWidth = 1

/**
 * Spacing gap between columns.
 * @param barSpacingMedia - spacing between bars (media coordinate)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns Spacing gap between columns (in Bitmap coordinates)
 */
function columnSpacing(barSpacingMedia: number, horizontalPixelRatio: number) {
  return Math.ceil(barSpacingMedia * horizontalPixelRatio) <= showSpacingMinimalBarWidth
    ? 0
    : Math.max(1, Math.floor(horizontalPixelRatio))
}

/**
 * Desired width for columns. This may not be the final width because
 * it may be adjusted later to ensure all columns on screen have a
 * consistent width and gap.
 * @param barSpacingMedia - spacing between bars (media coordinate)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @param spacing - Spacing gap between columns (in Bitmap coordinates). (optional, provide if you have already calculated it)
 * @returns Desired width for column bars (in Bitmap coordinates)
 */
function desiredColumnWidth(barSpacingMedia: number, horizontalPixelRatio: number, spacing?: number) {
  return (
    Math.round(barSpacingMedia * horizontalPixelRatio) -
    (spacing ?? columnSpacing(barSpacingMedia, horizontalPixelRatio))
  )
}

interface ColumnCommon {
  /** Spacing gap between columns */
  spacing: number
  /** Shift columns left by one pixel */
  shiftLeft: boolean
  /** Half width of a column */
  columnHalfWidthBitmap: number
  /** horizontal pixel ratio */
  horizontalPixelRatio: number
}

/**
 * Calculated values which are common to all the columns on the screen, and
 * are required to calculate the individual positions.
 * @param barSpacingMedia - spacing between bars (media coordinate)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns calculated values for subsequent column calculations
 */
function columnCommon(barSpacingMedia: number, horizontalPixelRatio: number): ColumnCommon {
  const spacing = columnSpacing(barSpacingMedia, horizontalPixelRatio)
  const columnWidthBitmap = desiredColumnWidth(barSpacingMedia, horizontalPixelRatio, spacing)
  const shiftLeft = columnWidthBitmap % 2 === 0
  const columnHalfWidthBitmap = (columnWidthBitmap - (shiftLeft ? 0 : 1)) / 2
  return {
    spacing,
    shiftLeft,
    columnHalfWidthBitmap,
    horizontalPixelRatio,
  }
}

export interface ColumnPosition {
  left: number
  right: number
  shiftLeft: boolean
}

/**
 * Calculate the position for a column. These values can be later adjusted
 * by a second pass which corrects widths, and shifts columns.
 * @param xMedia - column x position (center) in media coordinates
 * @param columnData - precalculated common values (returned by `columnCommon`)
 * @param previousPosition - result from this function for the previous bar.
 * @returns initial column position
 */
function calculateColumnPosition(
  xMedia: number,
  columnData: ColumnCommon,
  previousPosition: ColumnPosition | undefined
): ColumnPosition {
  const xBitmapUnRounded = xMedia * columnData.horizontalPixelRatio
  const xBitmap = Math.round(xBitmapUnRounded)
  const xPositions: ColumnPosition = {
    left: xBitmap - columnData.columnHalfWidthBitmap,
    right: xBitmap + columnData.columnHalfWidthBitmap - (columnData.shiftLeft ? 1 : 0),
    shiftLeft: xBitmap > xBitmapUnRounded,
  }
  const expectedAlignmentShift = columnData.spacing + 1
  if (previousPosition) {
    if (xPositions.left - previousPosition.right !== expectedAlignmentShift) {
      // need to adjust alignment
      if (previousPosition.shiftLeft) {
        previousPosition.right = xPositions.left - expectedAlignmentShift
      } else {
        xPositions.left = previousPosition.right + expectedAlignmentShift
      }
    }
  }
  return xPositions
}

interface ColumnPositionItem {
  x: number
  column?: ColumnPosition
}

/**
 * Calculates the column positions and widths for bars using the existing the
 * array of items.
 * @param items - bar items which include an `x` property, and will be mutated to contain a column property
 * @param barSpacingMedia - bar spacing in media coordinates
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @param startIndex - start index for visible bars within the items array
 * @param endIndex - end index for visible bars within the items array
 */
export function calculateColumnPositionsInPlace(
  items: ColumnPositionItem[],
  barSpacingMedia: number,
  horizontalPixelRatio: number,
  startIndex: number,
  endIndex: number
): void {
  const common = columnCommon(barSpacingMedia, horizontalPixelRatio)
  let previous: ColumnPosition | undefined = undefined
  for (let i = startIndex; i < Math.min(endIndex, items.length); i++) {
    items[i].column = calculateColumnPosition(items[i].x, common, previous)
    previous = items[i].column
  }
  const minColumnWidth = (items as ColumnPositionItem[]).reduce(
    (smallest: number, item: ColumnPositionItem, index: number) => {
      if (!item.column || index < startIndex || index > endIndex) return smallest
      if (item.column.right < item.column.left) {
        item.column.right = item.column.left
      }
      const width = item.column.right - item.column.left + 1
      return Math.min(smallest, width)
    },
    Math.ceil(barSpacingMedia * horizontalPixelRatio)
  )
  if (common.spacing > 0 && minColumnWidth < alignToMinimalWidthLimit) {
    ;(items as ColumnPositionItem[]).forEach((item: ColumnPositionItem, index: number) => {
      if (!item.column || index < startIndex || index > endIndex) return
      const width = item.column.right - item.column.left + 1
      if (width <= minColumnWidth) return item
      if (item.column.shiftLeft) {
        item.column.right -= 1
      } else {
        item.column.left += 1
      }
      return item.column
    })
  }
}
